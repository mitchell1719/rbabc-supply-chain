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

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSkeleton,
    LastUpdated
  ],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.css'
})
export class Suppliers
implements OnInit {

  suppliers: any[] = [];

  loading = true;

  saving = false;

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

    this.loading = true;

    try {

      this.suppliers =
        await this.service
          .getSuppliers();

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

    } finally {

      this.saving = false;

    }

  }

}