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
  LoadingSkeleton
} from '../../components/loading-skeleton/loading-skeleton';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import {
  CopyButton
} from '../../components/copy-button/copy-button';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSkeleton,
    LastUpdated,
    CopyButton
  ],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.css'
})
export class PurchaseOrders
implements OnInit {

  orders: any[] = [];

  loading = true;

  saving = false;

  form = {
    supplierName: '',
    reference: '',
    amount: 0,
    remarks: ''
  };

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading = true;

    try {

      this.orders =
        await this.service
          .getPurchaseOrders();

    } finally {

      this.loading = false;

    }

  }

  async save() {

    if (
      !this.form.supplierName.trim()
    ) {

      alert(
        'Supplier is required.'
      );

      return;
    }

    this.saving = true;

    try {

      await this.service
        .createPurchaseOrder({
          ...this.form
        });

      this.form = {
        supplierName: '',
        reference: '',
        amount: 0,
        remarks: ''
      };

      await this.load();

    } finally {

      this.saving = false;

    }

  }

}