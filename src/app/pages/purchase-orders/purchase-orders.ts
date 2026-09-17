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
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.css'
})
export class PurchaseOrders
implements OnInit {

  orders: any[] = [];

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

    this.orders =
      await this.service
        .getPurchaseOrders();

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

  }

}