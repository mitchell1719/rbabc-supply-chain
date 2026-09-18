import { Component, OnInit, computed, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RouterLink } from '@angular/router';

import { Branch, PurchaseRequest } from '../../models/supply-chain.model';

import { SupplyChainService } from '../../services/supply-chain.service';

import { DataState } from '../../components/data-state/data-state';
import { LastUpdated } from '../../components/last-updated/last-updated';
import { CopyButton } from '../../components/copy-button/copy-button';

import { AuthService } from '../../services/auth.service';
import { ExportService } from '../../services/export.service';

import { REQUEST_CREATOR_ROLES } from '../../config/roles.config';

@Component({
  selector: 'app-purchase-requests',

  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink, DataState, LastUpdated, CopyButton],

  templateUrl: './purchase-requests.html',

  styleUrl: './purchase-requests.css',
})
export class PurchaseRequests implements OnInit {
  readonly requests = signal<PurchaseRequest[]>([]);

  readonly branches = signal<Branch[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  /* =====================================
     FILTERS
  ===================================== */

  readonly filterHq = signal('');
  readonly filterBranch = signal('');
  readonly filterRns = signal('');
  readonly filterDm = signal('');

  /** branchId -> assigned RNS name, so requests (which don't store RNS directly) can be filtered by it. */
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
    this.distinctSorted(this.requests().map((r) => r.headquartersName))
  );

  readonly branchOptions = computed(() =>
    this.distinctSorted(this.requests().map((r) => r.branchName))
  );

  readonly dmOptions = computed(() =>
    this.distinctSorted(this.requests().map((r) => r.districtManagerName))
  );

  readonly rnsOptions = computed(() => {
    const lookup = this.rnsByBranchId();

    return this.distinctSorted(
      this.requests()
        .map((r) => lookup.get(r.branchId) || '')
        .filter((name) => name !== ''),
    );
  });

  readonly filteredRequests = computed(() => {
    const lookup = this.rnsByBranchId();

    const hq = this.filterHq();
    const branch = this.filterBranch();
    const rns = this.filterRns();
    const dm = this.filterDm();

    return this.requests().filter((request) => {
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
    private service: SupplyChainService,
    private auth: AuthService,
    private exportService: ExportService,
  ) {}

  /** Whether the signed-in user may edit and resubmit a returned request. */
  canEditReturned(request: PurchaseRequest): boolean {
    return (
      request.status === 'RETURNED_FOR_REVISION' &&
      this.auth.hasAnyRole(REQUEST_CREATOR_ROLES) &&
      this.auth.canAccessBranch(request.branchId)
    );
  }

  get canCreate(): boolean {
    return this.auth.hasAnyRole(REQUEST_CREATOR_ROLES);
  }

  async ngOnInit() {
    await this.loadRequests();
  }

  async loadRequests() {
    this.loading.set(true);

    this.errorMessage.set('');

    try {
      const profile = this.auth.profile();

      // A Nurse only sees requests for their own assigned branch.
      const [requests, branches] = await Promise.all([
        profile?.role === 'NURSE' && profile.branchId
          ? this.service.getPurchaseRequestsForBranch(profile.branchId)
          : this.service.getPurchaseRequests(),
        this.service.getBranches(),
      ]);

      this.requests.set(requests);
      this.branches.set(branches);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to load purchase requests.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  exportCsv() {
    this.exportService.exportToCsv(
      'purchase-requests',
      ['PR No.', 'Date', 'Branch', 'Assigned HQ', 'District Manager', 'Total', 'Status'],
      this.filteredRequests().map((r) => [
        r.controlNumber,
        r.requestDate,
        r.branchName,
        r.headquartersName,
        r.districtManagerName,
        r.totalAmount,
        r.status.replaceAll('_', ' '),
      ]),
    );
  }

  exportPdf() {
    this.exportService.exportToPdf();
  }
}
