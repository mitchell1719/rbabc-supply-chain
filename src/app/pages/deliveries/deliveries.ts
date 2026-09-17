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
  ConfirmService
} from '../../services/confirm.service';

import {
  LoadingSkeleton
} from '../../components/loading-skeleton/loading-skeleton';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import {
  CopyButton
} from '../../components/copy-button/copy-button';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, LoadingSkeleton, LastUpdated, CopyButton],
  templateUrl: './deliveries.html',
  styleUrl: './deliveries.css'
})
export class Deliveries
implements OnInit {

  deliveries: any[] = [];

  loading = true;

  constructor(
    private service:
      SupplyChainService,
    private confirmService:
      ConfirmService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading = true;

    try {

      this.deliveries =
        await this.service
          .getDeliveries();

    } finally {

      this.loading = false;

    }

  }

  async dispatch(
    delivery: any
  ) {

    if (!delivery.id) {
      return;
    }

    const confirmed =
      await this.confirmService.confirm({
        title: 'Dispatch Delivery',
        message: `Dispatch ${delivery.deliveryNumber} to ${delivery.branchName}? This cannot be undone.`,
        confirmLabel: 'Dispatch',
      });

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