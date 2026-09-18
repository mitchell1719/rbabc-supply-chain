import {
  Component,
  OnInit,
  signal
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
  DeliveryNote
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

@Component({
  selector: 'app-receiving',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataState
  ],
  templateUrl: './receiving.html',
  styleUrl: './receiving.css'
})
export class Receiving
implements OnInit {

  readonly deliveries = signal<DeliveryNote[]>([]);

  receiver:
    Record<string,string> = {};

  discrepancy:
    Record<string,boolean> = {};

  remarks:
    Record<string,string> = {};

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly submittingId = signal<string | null>(null);

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

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      this.deliveries.set(
        await this.service
          .getDeliveriesForReceiving()
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load deliveries for receiving.'
      );

    } finally {

      this.loading.set(false);

    }

  }

  async receive(
    delivery: DeliveryNote
  ) {

    if (!delivery.id) {
      return;
    }

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

    this.submittingId.set(delivery.id);

    try {

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

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to submit receiving report.'
      );

    } finally {

      this.submittingId.set(null);

    }

  }

}
