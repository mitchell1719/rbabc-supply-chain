import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

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
  selector: 'app-procurement',
  standalone: true,
  imports: [CommonModule, LoadingSkeleton, LastUpdated, CopyButton],
  templateUrl: './procurement.html',
  styleUrl: './procurement.css'
})
export class Procurement
implements OnInit {

  records: PurchaseRequest[] = [];

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

      this.records =
        all.filter(
          x =>
            x.status ===
            'PRS_CREATED'

            ||

            x.status ===
            'WAREHOUSE_CHECK'

            ||

            x.status ===
            'FOR_PROCUREMENT'

            ||

            x.status ===
            'PROCUREMENT_COMPLETED'
        );

    } finally {

      this.loading = false;

    }

  }

  async procure(
    request: PurchaseRequest
  ) {

    const confirmed =
      await this.confirmService.confirm({
        title: 'Send for Procurement',
        message: `Send ${request.controlNumber} for supplier procurement? Warehouse stock was insufficient to fulfill it directly.`,
        confirmLabel: 'Send for Procurement',
      });

    if (!confirmed) {
      return;
    }

    await this.service
      .sendForProcurement(
        request.id!,
        'Supply Officer'
      );

    await this.load();

  }

  async complete(
    request: PurchaseRequest
  ) {

    const confirmed =
      await this.confirmService.confirm({
        title: 'Complete Procurement',
        message: `Mark procurement for ${request.controlNumber} as completed? This finalizes the procurement step.`,
        confirmLabel: 'Complete Procurement',
      });

    if (!confirmed) {
      return;
    }

    await this.service
      .completeProcurement(
        request.id!,
        'Supply Officer'
      );

    await this.load();

  }

}