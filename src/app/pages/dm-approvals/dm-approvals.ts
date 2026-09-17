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

@Component({
  selector: 'app-dm-approvals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadge
  ],
  templateUrl: './dm-approvals.html',
  styleUrl: './dm-approvals.css'
})
export class DmApprovals implements OnInit {

  requests: PurchaseRequest[] = [];

  comments: Record<string,string> = {};

  constructor(
    private service: SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    const all =
      await this.service.getPurchaseRequests();

    this.requests =
      all.filter(
        x =>
          x.status ===
          'PENDING_DM_APPROVAL'
      );

  }

  async approve(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    const confirmed =
      confirm(
        `Approve ${request.controlNumber}?`
      );

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