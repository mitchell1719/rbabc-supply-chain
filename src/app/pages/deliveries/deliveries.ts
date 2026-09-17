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
  DeliveryNote
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import {
  CopyButton
} from '../../components/copy-button/copy-button';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, DataState, LastUpdated, CopyButton],
  templateUrl: './deliveries.html',
  styleUrl: './deliveries.css'
})
export class Deliveries
implements OnInit {

  deliveries: DeliveryNote[] = [];

  loading = false;

  errorMessage = '';

  dispatchingId: string | null = null;

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

    this.errorMessage = '';

    try {

      this.deliveries =
        await this.service
          .getDeliveries();

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load deliveries.';

    } finally {

      this.loading = false;

    }

  }

  async dispatch(
    delivery: DeliveryNote
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

    this.dispatchingId = delivery.id;

    try {

      await this.service
        .dispatchDelivery(
          delivery.id
        );

      await this.load();

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to dispatch delivery.'
      );

    } finally {

      this.dispatchingId = null;

    }

  }

}
