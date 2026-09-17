import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  DeliveryNote,
  Inventory,
  PurchaseRequest
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, DataState],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports
implements OnInit {

  requests: PurchaseRequest[] = [];
  inventory: Inventory[] = [];
  deliveries: DeliveryNote[] = [];

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

      const [requests, inventory, deliveries] = await Promise.all([
        this.service.getPurchaseRequests(),
        this.service.getInventory(),
        this.service.getDeliveries(),
      ]);

      this.requests = requests;
      this.inventory = inventory;
      this.deliveries = deliveries;

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load report data.';

    } finally {

      this.loading = false;

    }

  }

  get completed() {

    return this.requests.filter(
      x =>
        x.status ===
        'COMPLETED'
    ).length;

  }

  get lowStock() {

    return this.inventory.filter(
      x =>
        Number(x.quantity) <=
        Number(x.reorderLevel)
    ).length;

  }

}
