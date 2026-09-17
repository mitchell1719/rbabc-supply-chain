import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

import { PurchaseRequest } from '../../models/supply-chain.model';

import { SupplyChainService } from '../../services/supply-chain.service';

import { DataState } from '../../components/data-state/data-state';

@Component({
  selector: 'app-purchase-requests',

  standalone: true,

  imports: [CommonModule, RouterLink, DataState],

  templateUrl: './purchase-requests.html',

  styleUrl: './purchase-requests.css',
})
export class PurchaseRequests implements OnInit {
  requests: PurchaseRequest[] = [];

  loading = false;

  errorMessage = '';

  constructor(private service: SupplyChainService) {}

  async ngOnInit() {
    await this.loadRequests();
  }

  async loadRequests() {
    this.loading = true;

    this.errorMessage = '';

    try {
      this.requests = await this.service.getPurchaseRequests();
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Unable to load purchase requests.';
    } finally {
      this.loading = false;
    }
  }
}
