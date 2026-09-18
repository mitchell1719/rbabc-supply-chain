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
  Inventory as InventoryRecord
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataState,
    LastUpdated
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {

  readonly inventory = signal<InventoryRecord[]>([]);

  search = '';

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  constructor(
    private service:
      SupplyChainService,

    private auth: AuthService,
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      const profile = this.auth.profile();

      const records = await this.service.getInventory();

      // A Nurse only sees inventory held at their own assigned branch.
      this.inventory.set(
        profile?.role === 'NURSE' && profile.branchId
          ? records.filter(
              (item) => item.locationType === 'BRANCH' && item.locationId === profile.branchId,
            )
          : records,
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load inventory.'
      );

    } finally {

      this.loading.set(false);

    }

  }

  get filtered() {

    const keyword =
      this.search
        .trim()
        .toLowerCase();

    const inventory = this.inventory();

    if (!keyword) {
      return inventory;
    }

    return inventory.filter(
      item =>
        item.productName
          ?.toLowerCase()
          .includes(keyword)

        ||

        item.locationName
          ?.toLowerCase()
          .includes(keyword)

        ||

        item.batchNumber
          ?.toLowerCase()
          .includes(keyword)
    );

  }

  get emptyMessage(): string {
    return this.search.trim()
      ? 'No inventory items match your search.'
      : 'No inventory records found.';
  }

  getStatus(item: InventoryRecord) {

    if (
      Number(item.quantity) === 0
    ) {
      return 'Critical';
    }

    if (
      Number(item.quantity) <=
      Number(item.reorderLevel)
    ) {
      return 'Low Stock';
    }

    return 'In Stock';

  }

}
