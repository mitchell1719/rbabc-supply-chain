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

  deliveries: DeliveryNote[] = [];

  receiver:
    Record<string,string> = {};

  discrepancy:
    Record<string,boolean> = {};

  remarks:
    Record<string,string> = {};

  loading = false;

  errorMessage = '';

  submittingId: string | null = null;

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading = true;

    this.errorMessage = '';

    try {

      this.deliveries =
        await this.service
          .getDeliveriesForReceiving();

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load deliveries for receiving.';

    } finally {

      this.loading = false;

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

    this.submittingId = delivery.id;

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

      this.submittingId = null;

    }

  }

}
