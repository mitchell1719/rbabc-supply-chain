import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  PurchaseRequest
} from '../../models/supply-chain.model';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './procurement.html',
  styleUrl: './procurement.css'
})
export class Procurement
implements OnInit {

  records: PurchaseRequest[] = [];

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    const all =
      await this.service
        .getPurchaseRequests();

    this.records =
      all.filter(
        x =>
          x.status ===
          'PRS_CREATED'

          ||

          x.status ===
          'WAREHOUSE_CHECK'

          ||

          x.status ===
          'FOR_PROCUREMENT'

          ||

          x.status ===
          'PROCUREMENT_COMPLETED'
      );

  }

  async procure(
    request: PurchaseRequest
  ) {

    await this.service
      .sendForProcurement(
        request.id!,
        'Supply Officer'
      );

    await this.load();

  }

  async complete(
    request: PurchaseRequest
  ) {

    await this.service
      .completeProcurement(
        request.id!,
        'Supply Officer'
      );

    await this.load();

  }

}