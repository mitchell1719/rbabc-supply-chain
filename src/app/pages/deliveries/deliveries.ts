import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import { RouterLink } from '@angular/router';

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

import { AuthService } from '../../services/auth.service';

import { PROCUREMENT_ROLES } from '../../config/roles.config';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, RouterLink, DataState, LastUpdated, CopyButton],
  templateUrl: './deliveries.html',
  styleUrl: './deliveries.css'
})
export class Deliveries
implements OnInit {

  readonly deliveries = signal<DeliveryNote[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly dispatchingId = signal<string | null>(null);

  constructor(
    private service:
      SupplyChainService,

    private confirmService:
      ConfirmService,

    private auth: AuthService,
  ) {}

  /** Only a Supply Officer dispatches deliveries (they "Manage" Delivery Tracking). */
  get canDispatch(): boolean {
    return this.auth.hasAnyRole(PROCUREMENT_ROLES);
  }

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      this.deliveries.set(
        await this.service
          .getDeliveries()
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load deliveries.'
      );

    } finally {

      this.loading.set(false);

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

    this.dispatchingId.set(delivery.id);

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

      this.dispatchingId.set(null);

    }

  }

}
