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
  PurchaseOrder
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataState
  ],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.css'
})
export class PurchaseOrders
implements OnInit {

  orders: PurchaseOrder[] = [];

  form = {
    supplierName: '',
    reference: '',
    amount: 0,
    remarks: ''
  };

  loading = false;

  errorMessage = '';

  saving = false;

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

      this.orders =
        await this.service
          .getPurchaseOrders();

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load purchase orders.';

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

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to save purchase order.'
      );

    } finally {

      this.saving = false;

    }

  }

}
