import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  ConfirmService
} from '../../services/confirm.service';

import {
  LoadingSkeleton
} from '../../components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-receiving',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSkeleton
  ],
  templateUrl: './receiving.html',
  styleUrl: './receiving.css'
})
export class Receiving
implements OnInit {

  deliveries: any[] = [];

  loading = true;

  receiver:
    Record<string,string> = {};

  discrepancy:
    Record<string,boolean> = {};

  remarks:
    Record<string,string> = {};

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

      this.deliveries =
        await this.service
          .getDeliveriesForReceiving();

    } finally {

      this.loading = false;

    }

  }

  async receive(
    delivery: any
  ) {

    const name =
      this.receiver[
        delivery.id
      ]?.trim();

    if (!name) {

      alert(
        'Received By is required.'
      );

      return;
    }

    const hasDiscrepancy =
      !!this.discrepancy[
        delivery.id
      ];

    const remarks =
      this.remarks[
        delivery.id
      ] || '';

    if (
      hasDiscrepancy &&
      !remarks.trim()
    ) {

      alert(
        'Describe the discrepancy.'
      );

      return;
    }

    const confirmed =
      await this.confirmService.confirm({
        title: 'Submit Receiving Report',
        message: hasDiscrepancy
          ? `Submit this receiving report for ${delivery.deliveryNumber} with a flagged discrepancy? It will require resolution.`
          : `Submit this receiving report for ${delivery.deliveryNumber} as fully verified? This cannot be undone.`,
        confirmLabel: 'Submit Report',
        danger: hasDiscrepancy,
      });

    if (!confirmed) {
      return;
    }

    await this.service
      .createReceivingReport(
        delivery,
        name,
        hasDiscrepancy,
        remarks
      );

    await this.load();

    alert(
      'Receiving Report submitted.'
    );

  }

}