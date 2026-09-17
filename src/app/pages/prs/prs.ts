import {
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  PurchaseRequest
} from '../../models/supply-chain.model';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

@Component({
  selector: 'app-prs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prs.html',
  styleUrl: './prs.css'
})
export class Prs implements OnInit {

  pending: PurchaseRequest[] = [];

  prsRecords: any[] = [];

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.pending =
 await this.service
 .getPurchaseRequests();

    this.prsRecords =
      await this.service
        .getPRS();

  }

  async generate(
    request: PurchaseRequest
  ) {

    const confirmed =
      confirm(
        `Generate PRS for ${request.controlNumber}?`
      );

    if (!confirmed) {
      return;
    }

    try {

      await this.service
        .createPRSFromRequest(
          request,
          'HQ Supply Officer'
        );

      await this.load();

      alert(
        'PRS generated successfully.'
      );

    } catch (error: any) {

      alert(
        error?.message ||
        'Unable to generate PRS.'
      );

    }

  }

}