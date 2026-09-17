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
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  PurchaseRequest
} from '../../models/supply-chain.model';

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
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCard,
    StatusBadge,
    LoadingSkeleton,
    LastUpdated,
    CopyButton
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  requests: PurchaseRequest[] = [];

  loading = true;

  async ngOnInit() {
    try {
      this.requests =
        await this.service.getPurchaseRequests();
    } finally {
      this.loading = false;
    }
  }

  constructor(
    private service: SupplyChainService
  ) {}

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