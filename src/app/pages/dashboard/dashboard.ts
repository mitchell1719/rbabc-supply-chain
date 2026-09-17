import {
  Component,
  OnInit,
  computed,
  signal
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

  // Signals rather than plain properties: a signal write notifies
  // Angular's change-detection scheduler directly, so the view updates
  // reliably regardless of which zone the underlying Firestore call
  // settles in (see SupplyChainService.withErrorHandling for why that
  // matters with the Firebase SDK).
  readonly requests = signal<PurchaseRequest[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly recentRequests = computed(() => this.requests().slice(0, 5));

  readonly pendingDM = computed(
    () => this.requests().filter(x => x.status === 'PENDING_DM_APPROVAL').length
  );

  readonly approved = computed(
    () => this.requests().filter(x => x.status === 'DM_APPROVED').length
  );

  readonly procurement = computed(
    () => this.requests().filter(x => x.status === 'FOR_PROCUREMENT').length
  );

  readonly completed = computed(
    () => this.requests().filter(x => x.status === 'COMPLETED').length
  );

  constructor(
    private service: SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);

    this.errorMessage.set('');

    try {
      this.requests.set(await this.service.getPurchaseRequests());
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to load dashboard data.'
      );
    } finally {
      this.loading.set(false);
    }
  }

}
