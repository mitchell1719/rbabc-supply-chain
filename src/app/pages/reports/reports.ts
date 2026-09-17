import {
  Component,
  OnInit,
  computed,
  signal
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

  readonly requests = signal<PurchaseRequest[]>([]);
  readonly inventory = signal<Inventory[]>([]);
  readonly deliveries = signal<DeliveryNote[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly completed = computed(
    () => this.requests().filter(x => x.status === 'COMPLETED').length
  );

  readonly lowStock = computed(
    () => this.inventory().filter(x => Number(x.quantity) <= Number(x.reorderLevel)).length
  );

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

      const [requests, inventory, deliveries] = await Promise.all([
        this.service.getPurchaseRequests(),
        this.service.getInventory(),
        this.service.getDeliveries(),
      ]);

      this.requests.set(requests);
      this.inventory.set(inventory);
      this.deliveries.set(deliveries);

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load report data.'
      );

    } finally {

      this.loading.set(false);

    }

  }

}
