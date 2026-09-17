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

import {
  ReceivingReport
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

@Component({
  selector: 'app-discrepancies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataState
  ],
  templateUrl: './discrepancies.html',
  styleUrl: './discrepancies.css'
})
export class Discrepancies
implements OnInit {

  records: ReceivingReport[] = [];

  resolution:
    Record<string,string> = {};

  loading = false;

  errorMessage = '';

  resolvingId: string | null = null;

  constructor(
    private service:
      SupplyChainService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading = true;

    this.errorMessage = '';

    try {

      this.records =
        await this.service
          .getDiscrepancies();

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load discrepancies.';

    } finally {

      this.loading = false;

    }

  }

  async resolve(
    record: ReceivingReport
  ) {

    if (!record.id) {
      return;
    }

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

    this.resolvingId = record.id;

    try {

      await this.service
        .resolveDiscrepancy(
          record.id,
          text
        );

      await this.load();

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to resolve discrepancy.'
      );

    } finally {

      this.resolvingId = null;

    }

  }

}
