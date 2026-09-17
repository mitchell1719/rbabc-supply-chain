import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

import { PurchaseRequest } from '../../models/supply-chain.model';

import { SupplyChainService } from '../../services/supply-chain.service';

import { LoadingSkeleton } from '../../components/loading-skeleton/loading-skeleton';
import { LastUpdated } from '../../components/last-updated/last-updated';
import { CopyButton } from '../../components/copy-button/copy-button';

@Component({
  selector: 'app-purchase-requests',

  standalone: true,

  imports: [CommonModule, RouterLink, LoadingSkeleton, LastUpdated, CopyButton],

  templateUrl: './purchase-requests.html',

  styleUrl: './purchase-requests.css',
})
export class PurchaseRequests implements OnInit {
  requests: PurchaseRequest[] = [];

  loading: boolean = false;

  constructor(private service: SupplyChainService) {}

  async ngOnInit() {
    await this.loadRequests();
  }

  async loadRequests() {
    console.log('Loading PR list...');

    this.loading = true;

    try {
      const data = await this.service.getPurchaseRequests();

      console.log('PR DATA:', data);

      this.requests = data;
    } catch (error) {
      console.error('PR LOAD ERROR:', error);

      alert('Unable to load purchase requests.');
    } finally {
      this.loading = false;

      console.log('Loading finished');
    }
  }
}
