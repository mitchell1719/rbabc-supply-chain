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
  ConfirmService
} from '../../services/confirm.service';

import {
  LoadingSkeleton
} from '../../components/loading-skeleton/loading-skeleton';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import {
  CopyButton
} from '../../components/copy-button/copy-button';

@Component({
  selector: 'app-discrepancies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSkeleton,
    LastUpdated,
    CopyButton
  ],
  templateUrl: './discrepancies.html',
  styleUrl: './discrepancies.css'
})
export class Discrepancies
implements OnInit {

  records: any[] = [];

  loading = true;

  resolution:
    Record<string,string> = {};

  constructor(
    private service:
      SupplyChainService,
    private confirmService:
      ConfirmService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading = true;

    try {

      this.records =
        await this.service
          .getDiscrepancies();

    } finally {

      this.loading = false;

    }

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

    const confirmed =
      await this.confirmService.confirm({
        title: 'Resolve Discrepancy',
        message: `Mark the discrepancy on ${record.receivingNumber} as resolved? This action cannot be undone.`,
        confirmLabel: 'Resolve',
      });

    if (!confirmed) {
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