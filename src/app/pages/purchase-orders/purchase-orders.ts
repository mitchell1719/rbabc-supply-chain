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
  PurchaseOrder
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

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
    DataState,
    LastUpdated,
    CopyButton
  ],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.css'
})
export class PurchaseOrders
implements OnInit {

  readonly orders = signal<PurchaseOrder[]>([]);

  form = {
    supplierName: '',
    reference: '',
    amount: 0,
    remarks: ''
  };

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly saving = signal(false);

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      this.orders.set(
        await this.service
          .getPurchaseOrders()
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load purchase orders.'
      );

    } finally {

      this.loading.set(false);

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

    this.saving.set(true);

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

      this.saving.set(false);

    }

  }

}
