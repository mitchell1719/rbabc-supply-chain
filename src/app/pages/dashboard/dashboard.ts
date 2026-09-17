import {
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  StatCard
} from '../../components/stat-card/stat-card';

import {
  StatusBadge
} from '../../components/status-badge/status-badge';

import {
  DataState
} from '../../components/data-state/data-state';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import {
  CopyButton
} from '../../components/copy-button/copy-button';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  PurchaseRequest
} from '../../models/supply-chain.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCard,
    StatusBadge,
    DataState,
    LastUpdated,
    CopyButton
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  requests: PurchaseRequest[] = [];

  loading = false;

  errorMessage = '';

  constructor(
    private service: SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading = true;

    this.errorMessage = '';

    try {
      this.requests = await this.service.getPurchaseRequests();
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Unable to load dashboard data.';
    } finally {
      this.loading = false;
    }
  }

  get recentRequests() {
    return this.requests.slice(0, 5);
  }

  get pendingDM() {
    return this.requests.filter(
      x => x.status === 'PENDING_DM_APPROVAL'
    ).length;
  }

  get approved() {
    return this.requests.filter(
      x => x.status === 'DM_APPROVED'
    ).length;
  }

  get procurement() {
    return this.requests.filter(
      x => x.status === 'FOR_PROCUREMENT'
    ).length;
  }

  get completed() {
    return this.requests.filter(
      x => x.status === 'COMPLETED'
    ).length;
  }

}
