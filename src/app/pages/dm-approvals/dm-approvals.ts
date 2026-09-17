import {
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  ConfirmService
} from '../../services/confirm.service';

import {
  PurchaseRequest
} from '../../models/supply-chain.model';

import {
  StatusBadge
} from '../../components/status-badge/status-badge';

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
  selector: 'app-dm-approvals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadge,
    DataState,
    LastUpdated,
    CopyButton
  ],
  templateUrl: './dm-approvals.html',
  styleUrl: './dm-approvals.css'
})
export class DmApprovals implements OnInit {

  requests: PurchaseRequest[] = [];

  comments: Record<string,string> = {};

  loading = false;

  errorMessage = '';

  processingId: string | null = null;

  constructor(
    private service: SupplyChainService,

    private confirmService: ConfirmService,

    private auth: AuthService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading = true;

    this.errorMessage = '';

    try {

      this.requests =
        await this.service.getRequestsByStatus(
          'PENDING_DM_APPROVAL'
        );

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load pending approvals.';

    } finally {

      this.loading = false;

    }

  }

  async approve(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    const confirmed =
      await this.confirmService.confirm({
        title: 'Approve Purchase Request',
        message: `Approve ${request.controlNumber}? This will move it forward to HQ Consolidation.`,
        confirmLabel: 'Approve',
      });

    if (!confirmed) {
      return;
    }

    this.processingId = request.id;

    try {

      await this.service.approveByDM(
        request.id,
        this.auth.displayName(),
        this.comments[request.id] || ''
      );

      await this.load();

    } catch (error: any) {

      alert(
        error?.message ||
        'Unable to approve request.'
      );

    } finally {

      this.processingId = null;

    }

  }

  async returnRequest(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    const reason =
      this.comments[request.id]?.trim();

    if (!reason) {

      alert(
        'Please enter a reason before returning the request.'
      );

      return;
    }

    const confirmed =
      await this.confirmService.confirm({
        title: 'Return for Revision',
        message: `Return ${request.controlNumber} to the branch for revision? This cannot be undone.`,
        confirmLabel: 'Return Request',
        danger: true,
      });

    if (!confirmed) {
      return;
    }

    this.processingId = request.id;

    try {

      await this.service.returnForRevision(
        request.id,
        this.auth.displayName(),
        reason
      );

      await this.load();

    } catch (error: any) {

      alert(
        error?.message ||
        'Unable to return request.'
      );

    } finally {

      this.processingId = null;

    }

  }

}
