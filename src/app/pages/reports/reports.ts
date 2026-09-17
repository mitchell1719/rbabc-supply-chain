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
  LoadingSkeleton
} from '../../components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, LoadingSkeleton],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports
implements OnInit {

  requests: any[] = [];
  inventory: any[] = [];
  deliveries: any[] = [];

  loading = true;

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {

    this.loading = true;

    try {

      // Fetch in parallel instead of sequentially awaiting each one.
      const [requests, inventory, deliveries] = await Promise.all([
        this.service.getPurchaseRequests(),
        this.service.getInventory(),
        this.service.getDeliveries(),
      ]);

      this.requests = requests;
      this.inventory = inventory;
      this.deliveries = deliveries;

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