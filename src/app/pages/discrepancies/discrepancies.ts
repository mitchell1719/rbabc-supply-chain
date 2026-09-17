import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

@Component({
  selector: 'app-discrepancies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './discrepancies.html',
  styleUrl: './discrepancies.css'
})
export class Discrepancies
implements OnInit {

  records: any[] = [];

  resolution:
    Record<string,string> = {};

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.records =
      await this.service
        .getDiscrepancies();

  }

  async resolve(
    record: any
  ) {

    const text =
      this.resolution[
        record.id
      ]?.trim();

    if (!text) {

      alert(
        'Enter the discrepancy resolution.'
      );

      return;
    }

    await this.service
      .resolveDiscrepancy(
        record.id,
        text
      );

    await this.load();

  }

}