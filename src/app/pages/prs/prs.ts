import {
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  PurchaseRequest
} from '../../models/supply-chain.model';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  ConfirmService
} from '../../services/confirm.service';

import {
  LoadingSkeleton
} from '../../components/loading-skeleton/loading-skeleton';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import {
  CopyButton
} from '../../components/copy-button/copy-button';

@Component({
  selector: 'app-prs',
  standalone: true,
  imports: [CommonModule, LoadingSkeleton, LastUpdated, CopyButton],
  templateUrl: './prs.html',
  styleUrl: './prs.css'
})
export class Prs implements OnInit {

  // Only HQ-consolidated requests are eligible for PRS generation.
  pending: PurchaseRequest[] = [];

  prsRecords: any[] = [];

  loading = true;

  constructor(
    private service:
      SupplyChainService,
    private confirmService:
      ConfirmService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading = true;

    try {

      const all =
        await this.service
          .getPurchaseRequests();

      this.pending =
        all.filter(
          x => x.status === 'HQ_CONSOLIDATED'
        );

      this.prsRecords =
        await this.service
          .getPRS();

    } finally {

      this.loading = false;

    }

  }

  async generate(
    request: PurchaseRequest
  ) {

    const confirmed =
      await this.confirmService.confirm({
        title: 'Generate PRS',
        message: `Generate a Purchase Requisition Slip for ${request.controlNumber}?`,
        confirmLabel: 'Generate PRS',
      });

    if (!confirmed) {
      return;
    }

    try {

      await this.service
        .createPRSFromRequest(
          request,
          'HQ Supply Officer'
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

    }

  }

}