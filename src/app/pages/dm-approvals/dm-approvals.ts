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
  PurchaseRequest
} from '../../models/supply-chain.model';

import {
  StatusBadge
} from '../../components/status-badge/status-badge';

import {
  LoadingSkeleton
} from '../../components/loading-skeleton/loading-skeleton';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import {
  CopyButton
} from '../../components/copy-button/copy-button';

import {
  ConfirmService
} from '../../services/confirm.service';

@Component({
  selector: 'app-dm-approvals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadge,
    LoadingSkeleton,
    LastUpdated,
    CopyButton
  ],
  templateUrl: './dm-approvals.html',
  styleUrl: './dm-approvals.css'
})
export class DmApprovals implements OnInit {

  requests: PurchaseRequest[] = [];

  comments: Record<string,string> = {};

  loading = true;

  constructor(
    private service: SupplyChainService,
    private confirmService: ConfirmService,
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading = true;
    this.requests = [];

    try {

      const all =
        await this.service.getPurchaseRequests();

      this.requests =
        all.filter(
          x =>
            x.status ===
            'PENDING_DM_APPROVAL'
        );

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

    try {

      await this.service.approveByDM(
        request.id,
        request.districtManagerName,
        this.comments[request.id] || ''
      );

      await this.load();

    } catch (error: any) {

      alert(
        error?.message ||
        'Unable to approve request.'
      );

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

    try {

      await this.service.returnForRevision(
        request.id,
        request.districtManagerName,
        reason
      );

      await this.load();

    } catch (error: any) {

      alert(
        error?.message ||
        'Unable to return request.'
      );

    }

  }

}