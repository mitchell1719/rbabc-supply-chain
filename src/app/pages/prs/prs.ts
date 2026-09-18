import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  Branch,
  PRS as PRSRecord,
  PurchaseRequest
} from '../../models/supply-chain.model';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  ConfirmService
} from '../../services/confirm.service';

import {
  DataState
} from '../../components/data-state/data-state';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import {
  CopyButton
} from '../../components/copy-button/copy-button';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-prs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataState, LastUpdated, CopyButton],
  templateUrl: './prs.html',
  styleUrl: './prs.css'
})
export class Prs implements OnInit {

  readonly pending = signal<PurchaseRequest[]>([]);

  readonly prsRecords = signal<PRSRecord[]>([]);

  readonly branches = signal<Branch[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly generatingId = signal<string | null>(null);

  /* =====================================
     ADMIN FILTERS
  ===================================== */

  readonly filterHq = signal('');
  readonly filterBranch = signal('');
  readonly filterRns = signal('');
  readonly filterDm = signal('');

  /** branchId -> assigned RNS name, so pending requests (which don't store RNS directly) can be filtered by it. */
  private readonly rnsByBranchId = computed(() => {
    const map = new Map<string, string>();

    for (const branch of this.branches()) {
      if (branch.id) {
        map.set(branch.id, branch.rnsName);
      }
    }

    return map;
  });

  readonly hqOptions = computed(() =>
    this.distinctSorted(this.pending().map((r) => r.headquartersName))
  );

  readonly branchOptions = computed(() =>
    this.distinctSorted(this.pending().map((r) => r.branchName))
  );

  readonly dmOptions = computed(() =>
    this.distinctSorted(this.pending().map((r) => r.districtManagerName))
  );

  readonly rnsOptions = computed(() => {
    const lookup = this.rnsByBranchId();

    return this.distinctSorted(
      this.pending()
        .map((r) => lookup.get(r.branchId) || '')
        .filter((name) => name !== ''),
    );
  });

  readonly filteredPending = computed(() => {
    const lookup = this.rnsByBranchId();

    const hq = this.filterHq();
    const branch = this.filterBranch();
    const rns = this.filterRns();
    const dm = this.filterDm();

    return this.pending().filter((request) => {
      if (hq && request.headquartersName !== hq) {
        return false;
      }

      if (branch && request.branchName !== branch) {
        return false;
      }

      if (dm && request.districtManagerName !== dm) {
        return false;
      }

      if (rns && lookup.get(request.branchId) !== rns) {
        return false;
      }

      return true;
    });
  });

  readonly hasActiveFilters = computed(
    () => !!(this.filterHq() || this.filterBranch() || this.filterRns() || this.filterDm())
  );

  private distinctSorted(values: string[]): string[] {
    return Array.from(new Set(values.filter((v) => v))).sort((a, b) => a.localeCompare(b));
  }

  clearFilters() {
    this.filterHq.set('');
    this.filterBranch.set('');
    this.filterRns.set('');
    this.filterDm.set('');
  }

  constructor(
    private service:
      SupplyChainService,

    private confirmService:
      ConfirmService,

    private auth: AuthService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      const [pending, prsRecords, branches] = await Promise.all([
        this.service.getRequestsByStatus('HQ_CONSOLIDATED'),
        this.service.getPRS(),
        this.service.getBranches(),
      ]);

      this.pending.set(pending);

      this.prsRecords.set(prsRecords);

      this.branches.set(branches);

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load PRS data.'
      );

    } finally {

      this.loading.set(false);

    }

  }

  async generate(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    const confirmed =
      await this.confirmService.confirm({
        title: 'Generate PRS',
        message: `Generate a Purchase Requisition Slip for ${request.controlNumber}?`,
        confirmLabel: 'Generate PRS',
      });

    if (!confirmed) {
      return;
    }

    this.generatingId.set(request.id);

    try {

      await this.service
        .createPRSFromRequest(
          request,
          this.auth.displayName()
        );

      await this.load();

      alert(
        'PRS generated successfully.'
      );

    } catch (error: any) {

      alert(
        error?.message ||
        'Unable to generate PRS.'
      );

    } finally {

      this.generatingId.set(null);

    }

  }

}
