import { Component, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink, ActivatedRoute } from '@angular/router';

import { PurchaseRequest, WorkflowHistory } from '../../models/supply-chain.model';

import { SupplyChainService } from '../../services/supply-chain.service';

import { StatusBadge } from '../../components/status-badge/status-badge';

import { WorkflowTimeline } from '../../components/workflow-timeline/workflow-timeline';

import { DataState } from '../../components/data-state/data-state';
import { LastUpdated } from '../../components/last-updated/last-updated';
import { CopyButton } from '../../components/copy-button/copy-button';

@Component({
  selector: 'app-request-details',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    StatusBadge,
    WorkflowTimeline,
    DataState,
    LastUpdated,
    CopyButton,
  ],

  templateUrl: './request-details.html',

  styleUrl: './request-details.css',
})
export class RequestDetails implements OnInit {
  readonly request = signal<PurchaseRequest | null>(null);

  readonly history = signal<WorkflowHistory[]>([]);

  readonly loading = signal(true);

  readonly errorMessage = signal('');

  constructor(
    private route: ActivatedRoute,

    private service: SupplyChainService,
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage.set('No purchase request was specified.');

      this.loading.set(false);

      return;
    }

    await this.load(id);
  }

  async load(id: string) {
    this.loading.set(true);

    this.errorMessage.set('');

    try {
      const request = await this.service.getPurchaseRequest(id);

      this.request.set(request);

      if (!request) {
        this.errorMessage.set('Purchase request not found.');

        return;
      }

      this.history.set(await this.service.getWorkflowHistory(id));
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to load purchase request details.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  retry() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.load(id);
    }
  }
}
