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
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.css'
})
export class Suppliers
implements OnInit {

  suppliers: any[] = [];

  supplier = {

    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''

  };

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.suppliers =
      await this.service
        .getSuppliers();

  }

  async save() {

    if (
      !this.supplier.name.trim()
    ) {

      alert(
        'Supplier name is required.'
      );

      return;
    }

    await this.service
      .createSupplier({
        ...this.supplier
      });

    this.supplier = {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: ''
    };

    await this.load();

  }

}