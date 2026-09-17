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
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deliveries.html',
  styleUrl: './deliveries.css'
})
export class Deliveries
implements OnInit {

  deliveries: any[] = [];

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.deliveries =
      await this.service
        .getDeliveries();

  }

  async dispatch(
    delivery: any
  ) {

    if (!delivery.id) {
      return;
    }

    const confirmed =
      confirm(
        `Dispatch ${delivery.deliveryNumber}?`
      );

    if (!confirmed) {
      return;
    }

    await this.service
      .dispatchDelivery(
        delivery.id
      );

    await this.load();

  }

}