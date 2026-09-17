import { Component, OnInit } from '@angular/core';

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
  request: PurchaseRequest | null = null;

  history: WorkflowHistory[] = [];

  loading = true;

  errorMessage = '';

  constructor(
    private route: ActivatedRoute,

    private service: SupplyChainService,
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'No purchase request was specified.';

      this.loading = false;

      return;
    }

    await this.load(id);
  }

  async load(id: string) {
    this.loading = true;

    this.errorMessage = '';

    try {
      this.request = await this.service.getPurchaseRequest(id);

      if (!this.request) {
        this.errorMessage = 'Purchase request not found.';

        return;
      }

      this.history = await this.service.getWorkflowHistory(id);
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Unable to load purchase request details.';
    } finally {
      this.loading = false;
    }
  }

  retry() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.load(id);
    }
  }
}
