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
  Inventory as InventoryRecord
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataState
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {

  inventory: InventoryRecord[] = [];

  search = '';

  loading = false;

  errorMessage = '';

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

      this.inventory =
        await this.service
          .getInventory();

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load inventory.';

    } finally {

      this.loading = false;

    }

  }

  get filtered() {

    const keyword =
      this.search
        .trim()
        .toLowerCase();

    if (!keyword) {
      return this.inventory;
    }

    return this.inventory.filter(
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
