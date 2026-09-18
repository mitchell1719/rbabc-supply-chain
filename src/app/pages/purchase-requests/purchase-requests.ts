import { Component, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

import { PurchaseRequest } from '../../models/supply-chain.model';

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

  imports: [CommonModule, RouterLink, DataState, LastUpdated, CopyButton],

  templateUrl: './purchase-requests.html',

  styleUrl: './purchase-requests.css',
})
export class PurchaseRequests implements OnInit {
  readonly requests = signal<PurchaseRequest[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

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
      this.requests.set(
        profile?.role === 'NURSE' && profile.branchId
          ? await this.service.getPurchaseRequestsForBranch(profile.branchId)
          : await this.service.getPurchaseRequests(),
      );
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
      this.requests().map((r) => [
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
