import {
  Component,
  OnInit,
  signal
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
  ReceivingReport
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import {
  CopyButton
} from '../../components/copy-button/copy-button';

import { AuthService } from '../../services/auth.service';

import { PROCUREMENT_ROLES } from '../../config/roles.config';

@Component({
  selector: 'app-discrepancies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataState,
    LastUpdated,
    CopyButton
  ],
  templateUrl: './discrepancies.html',
  styleUrl: './discrepancies.css'
})
export class Discrepancies
implements OnInit {

  readonly records = signal<ReceivingReport[]>([]);

  resolution:
    Record<string,string> = {};

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly resolvingId = signal<string | null>(null);

  constructor(
    private service:
      SupplyChainService,

    private confirmService:
      ConfirmService,

    private auth: AuthService,
  ) {}

  /** Only a Supply Officer resolves discrepancies (per the RB ABC receiving workflow). */
  get canResolve(): boolean {
    return this.auth.hasAnyRole(PROCUREMENT_ROLES);
  }

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      this.records.set(
        await this.service
          .getDiscrepancies()
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load discrepancies.'
      );

    } finally {

      this.loading.set(false);

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

    const confirmed =
      await this.confirmService.confirm({
        title: 'Resolve Discrepancy',
        message: `Mark the discrepancy on ${record.receivingNumber} as resolved? This action cannot be undone.`,
        confirmLabel: 'Resolve',
      });

    if (!confirmed) {
      return;
    }

    this.resolvingId.set(record.id);

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

      this.resolvingId.set(null);

    }

  }

}
