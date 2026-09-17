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

@Component({
  selector: 'app-receiving',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './receiving.html',
  styleUrl: './receiving.css'
})
export class Receiving
implements OnInit {

  deliveries: any[] = [];

  receiver:
    Record<string,string> = {};

  discrepancy:
    Record<string,boolean> = {};

  remarks:
    Record<string,string> = {};

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.deliveries =
      await this.service
        .getDeliveriesForReceiving();

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