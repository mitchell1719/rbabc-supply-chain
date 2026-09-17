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

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports
implements OnInit {

  requests: any[] = [];
  inventory: any[] = [];
  deliveries: any[] = [];

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {

    this.requests =
      await this.service
        .getPurchaseRequests();

    this.inventory =
      await this.service
        .getInventory();

    this.deliveries =
      await this.service
        .getDeliveries();

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