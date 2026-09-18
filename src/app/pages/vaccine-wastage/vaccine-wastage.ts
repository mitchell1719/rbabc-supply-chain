import { Component, OnInit, computed, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SupplyChainService } from '../../services/supply-chain.service';
import { AuthService } from '../../services/auth.service';
import { ConfirmService } from '../../services/confirm.service';

import { Branch, MonitoredVaccine, VaccineWastageEntry } from '../../models/supply-chain.model';

import { REQUEST_CREATOR_ROLES } from '../../config/roles.config';

import { DataState } from '../../components/data-state/data-state';

export const MONITORED_VACCINES: MonitoredVaccine[] = [
  'Abhayrab',
  'Speeda',
  'RIG',
  'Tetanus Toxoid',
  'TIG',
];

/** Non-numeric fields only need to be read at submit time, so they stay plain. */
interface WastageForm {
  branchId: string;
  vaccineName: MonitoredVaccine;
  date: string;
  reason: string;
}

function emptyForm(): WastageForm {
  return {
    branchId: '',
    vaccineName: 'Abhayrab',
    date: new Date().toISOString().substring(0, 10),
    reason: '',
  };
}

/**
 * Vial usage / wastage monitoring for the five vaccines the workflow calls
 * out for dedicated tracking (Abhayrab, Speeda, RIG, Tetanus Toxoid, TIG).
 * Formulas per the workflow spec:
 *   Expected Usage = Patients Served ÷ Vaccine Capacity
 *   Wastage = Available Vials - Used Vials
 */
@Component({
  selector: 'app-vaccine-wastage',
  standalone: true,
  imports: [CommonModule, FormsModule, DataState],
  templateUrl: './vaccine-wastage.html',
  styleUrl: './vaccine-wastage.css',
})
export class VaccineWastage implements OnInit {
  readonly vaccines = MONITORED_VACCINES;

  readonly entries = signal<VaccineWastageEntry[]>([]);

  readonly branches = signal<Branch[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly saving = signal(false);

  form: WastageForm = emptyForm();

  // Signals, not plain properties: `preview` is a computed() below, and
  // computed() only re-evaluates on signal reads - a plain property bound
  // via ngModel wouldn't ever cause it to recompute (see dashboard.ts's
  // comment on why this app's change-detection scheduler needs signals).
  readonly patientsServed = signal<number | null>(null);
  readonly vaccineCapacity = signal<number>(5);
  readonly availableVials = signal<number | null>(null);
  readonly usedVials = signal<number | null>(null);

  /** Live preview of the computed formulas as the form is filled in. */
  readonly preview = computed(() => {
    const capacity = Number(this.vaccineCapacity()) || 0;
    const patients = Number(this.patientsServed()) || 0;
    const available = Number(this.availableVials()) || 0;
    const used = Number(this.usedVials()) || 0;

    return {
      expectedUsage: capacity > 0 ? Math.ceil(patients / capacity) : 0,
      wastage: available - used,
    };
  });

  readonly summaryByVaccine = computed(() => {
    const totals = new Map<string, { vaccineName: string; totalWastage: number; entries: number }>();

    for (const entry of this.entries()) {
      const existing = totals.get(entry.vaccineName);

      if (existing) {
        existing.totalWastage += entry.wastage;
        existing.entries += 1;
      } else {
        totals.set(entry.vaccineName, {
          vaccineName: entry.vaccineName,
          totalWastage: entry.wastage,
          entries: 1,
        });
      }
    }

    return Array.from(totals.values()).sort((a, b) => b.totalWastage - a.totalWastage);
  });

  constructor(
    private service: SupplyChainService,
    private auth: AuthService,
    private confirmService: ConfirmService,
  ) {}

  get canSubmit(): boolean {
    return this.auth.hasAnyRole(REQUEST_CREATOR_ROLES);
  }

  get branchLocked(): boolean {
    const profile = this.auth.profile();

    return profile?.role === 'NURSE' && !!profile.branchId;
  }

  async ngOnInit() {
    await this.load();

    const profile = this.auth.profile();

    if (profile?.role === 'NURSE' && profile.branchId) {
      this.form.branchId = profile.branchId;
    }
  }

  async load() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const profile = this.auth.profile();

      const [entries, branches] = await Promise.all([
        profile?.role === 'NURSE' && profile.branchId
          ? this.service.getVaccineWastageEntriesForBranch(profile.branchId)
          : this.service.getVaccineWastageEntries(),
        this.service.getBranches(),
      ]);

      entries.sort((a, b) => b.date.localeCompare(a.date));

      this.entries.set(entries);
      this.branches.set(branches);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to load vaccine wastage entries.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async submit() {
    if (this.saving()) {
      return;
    }

    if (!this.form.branchId) {
      alert('Please select a branch.');
      return;
    }

    const branch = this.branches().find((b) => b.id === this.form.branchId);

    if (!branch) {
      alert('Invalid branch.');
      return;
    }

    if (!this.auth.canAccessBranch(branch.id!)) {
      alert('You can only record wastage for your assigned branch.');
      return;
    }

    const patientsServed = Number(this.patientsServed());
    const availableVials = Number(this.availableVials());
    const usedVials = Number(this.usedVials());

    if (!Number.isFinite(patientsServed) || patientsServed < 0) {
      alert('Enter a valid number of patients served.');
      return;
    }

    if (!Number.isFinite(availableVials) || availableVials < 0 || !Number.isFinite(usedVials) || usedVials < 0) {
      alert('Enter valid vial counts.');
      return;
    }

    const wastage = availableVials - usedVials;

    if (wastage > 0 && !this.form.reason.trim()) {
      alert('A reason is required when vials are wasted.');
      return;
    }

    const confirmed = await this.confirmService.confirm({
      title: 'Record Vaccine Wastage Entry',
      message: `Save this ${this.form.vaccineName} entry for ${branch.name} on ${this.form.date}?`,
      confirmLabel: 'Save Entry',
    });

    if (!confirmed) {
      return;
    }

    this.saving.set(true);

    try {
      await this.service.createVaccineWastageEntry({
        branchId: branch.id!,
        branchName: branch.name,
        vaccineName: this.form.vaccineName,
        date: this.form.date,
        patientsServed,
        vaccineCapacity: Number(this.vaccineCapacity()),
        availableVials,
        usedVials,
        reason: this.form.reason,
        recordedBy: this.auth.displayName(),
      });

      const keepBranchId = this.form.branchId;

      this.form = emptyForm();
      this.form.branchId = keepBranchId;

      this.patientsServed.set(null);
      this.vaccineCapacity.set(5);
      this.availableVials.set(null);
      this.usedVials.set(null);

      await this.load();

      alert('Vaccine wastage entry saved.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to save the entry.');
    } finally {
      this.saving.set(false);
    }
  }
}
