import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink, ActivatedRoute } from '@angular/router';

import { PurchaseRequest, WorkflowHistory } from '../../models/supply-chain.model';

import { SupplyChainService } from '../../services/supply-chain.service';

import { StatusBadge } from '../../components/status-badge/status-badge';

import { WorkflowTimeline } from '../../components/workflow-timeline/workflow-timeline';

@Component({
  selector: 'app-request-details',

  standalone: true,

  imports: [CommonModule, RouterLink, StatusBadge, WorkflowTimeline],

  templateUrl: './request-details.html',

  styleUrl: './request-details.css',
})
export class RequestDetails implements OnInit {
  request: PurchaseRequest | null = null;

  history: WorkflowHistory[] = [];

  loading = true;

  constructor(
    private route: ActivatedRoute,

    private service: SupplyChainService,
  ) {}

  async ngOnInit() {
    console.log('REQUEST DETAILS INIT');

    const id = this.route.snapshot.paramMap.get('id');

    console.log('REQUEST ID:', id);

    if (!id) {
      console.error('NO ID FOUND IN URL');

      this.loading = false;

      return;
    }

    try {
      this.request = await this.service.getPurchaseRequest(id);

      console.log('REQUEST RESULT:', this.request);

      if (this.request) {
        this.history = await this.service.getWorkflowHistory(id);

        console.log('HISTORY RESULT:', this.history);
      }
    } catch (error) {
      console.error('REQUEST DETAILS ERROR:', error);
    } finally {
      this.loading = false;

      console.log('LOADING FALSE');
    }
  }
}
