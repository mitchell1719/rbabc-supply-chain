import { Component, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

import { PurchaseRequest } from '../../models/supply-chain.model';

import { SupplyChainService } from '../../services/supply-chain.service';

import { DataState } from '../../components/data-state/data-state';
import { LastUpdated } from '../../components/last-updated/last-updated';
import { CopyButton } from '../../components/copy-button/copy-button';

import { AuthService } from '../../services/auth.service';

import { REQUEST_CREATOR_ROLES } from '../../config/roles.config';

@Component({
  selector: 'app-purchase-requests',

  standalone: true,

  imports: [CommonModule, RouterLink, DataState, LastUpdated, CopyButton],

  templateUrl: './purchase-requests.html',

  styleUrl: './purchase-requests.css',
})
export class PurchaseRequests implements OnInit {
  readonly requests = signal<PurchaseRequest[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  constructor(
    private service: SupplyChainService,
    private auth: AuthService,
  ) {}

  /** Whether the signed-in user may edit and resubmit a returned request. */
  canEditReturned(request: PurchaseRequest): boolean {
    return (
      request.status === 'RETURNED_FOR_REVISION' &&
      this.auth.hasAnyRole(REQUEST_CREATOR_ROLES)
    );
  }

  get canCreate(): boolean {
    return this.auth.hasAnyRole(REQUEST_CREATOR_ROLES);
  }

  async ngOnInit() {
    await this.loadRequests();
  }

  async loadRequests() {
    this.loading.set(true);

    this.errorMessage.set('');

    try {
      this.requests.set(await this.service.getPurchaseRequests());
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to load purchase requests.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}
