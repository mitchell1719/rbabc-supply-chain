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
  Supplier
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataState
  ],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.css'
})
export class Suppliers
implements OnInit {

  suppliers: Supplier[] = [];

  supplier = {

    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''

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

      this.suppliers =
        await this.service
          .getSuppliers();

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load suppliers.';

    } finally {

      this.loading = false;

    }

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

    this.saving = true;

    try {

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

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to save supplier.'
      );

    } finally {

      this.saving = false;

    }

  }

}
