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
  Supplier
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataState,
    LastUpdated
  ],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.css'
})
export class Suppliers
implements OnInit {

  readonly suppliers = signal<Supplier[]>([]);

  supplier = {

    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''

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

      this.suppliers.set(
        await this.service
          .getSuppliers()
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load suppliers.'
      );

    } finally {

      this.loading.set(false);

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

    this.saving.set(true);

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

      this.saving.set(false);

    }

  }

}
