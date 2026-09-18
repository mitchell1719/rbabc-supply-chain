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
import { ExportService } from '../../services/export.service';

type StockFilter = 'ALL' | 'EXPIRING_SOON' | 'EXPIRED' | 'LOW_STOCK' | 'OUT_OF_STOCK';

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

  stockFilter: StockFilter = 'ALL';

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  constructor(
    private service:
      SupplyChainService,

    private auth: AuthService,

    private exportService: ExportService,
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

    let inventory = this.inventory();

    if (keyword) {
      inventory = inventory.filter(
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

    switch (this.stockFilter) {
      case 'EXPIRING_SOON':
        inventory = inventory.filter(
          (item) => this.service.isExpiringSoon(item) && !this.service.isExpired(item),
        );
        break;
      case 'EXPIRED':
        inventory = inventory.filter((item) => this.service.isExpired(item));
        break;
      case 'LOW_STOCK':
        inventory = inventory.filter((item) => this.getStatus(item) === 'Low Stock');
        break;
      case 'OUT_OF_STOCK':
        inventory = inventory.filter((item) => this.getStatus(item) === 'Critical');
        break;
    }

    // FEFO: First Expiry, First Out - soonest-expiring stock is always
    // surfaced first so it gets used/dispatched before it lapses.
    return [...inventory].sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;

      return a.expiryDate.localeCompare(b.expiryDate);
    });

  }

  get emptyMessage(): string {
    return this.search.trim()
      ? 'No inventory items match your search.'
      : 'No inventory records found.';
  }

  get expiringSoonCount(): number {
    return this.inventory().filter(
      (item) => this.service.isExpiringSoon(item) && !this.service.isExpired(item),
    ).length;
  }

  get expiredCount(): number {
    return this.inventory().filter((item) => this.service.isExpired(item)).length;
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

  isExpiringSoon(item: InventoryRecord): boolean {
    return this.service.isExpiringSoon(item) && !this.service.isExpired(item);
  }

  isExpired(item: InventoryRecord): boolean {
    return this.service.isExpired(item);
  }

  exportCsv() {
    this.exportService.exportToCsv(
      'inventory',
      ['Product', 'Location', 'Type', 'Batch', 'Expiry', 'Quantity', 'Reorder Level', 'Status'],
      this.filtered.map((item) => [
        item.productName,
        item.locationName,
        item.locationType,
        item.batchNumber,
        item.expiryDate,
        item.quantity,
        item.reorderLevel,
        this.getStatus(item),
      ]),
    );
  }

  exportPdf() {
    this.exportService.exportToPdf();
  }

}
