import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  PurchaseRequest
} from '../../models/supply-chain.model';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  ConfirmService
} from '../../services/confirm.service';

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

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [CommonModule, DataState, LastUpdated, CopyButton],
  templateUrl: './procurement.html',
  styleUrl: './procurement.css'
})
export class Procurement
implements OnInit {

  readonly records = signal<PurchaseRequest[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly processingId = signal<string | null>(null);

  constructor(
    private service:
      SupplyChainService,

    private confirmService:
      ConfirmService,

    private auth: AuthService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      this.records.set(
        await this.service
          .getRequestsByStatuses([
            'PRS_CREATED',
            'WAREHOUSE_CHECK',
            'FOR_PROCUREMENT',
            'PROCUREMENT_COMPLETED'
          ])
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load procurement records.'
      );

    } finally {

      this.loading.set(false);

    }

  }

  async procure(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    const confirmed =
      await this.confirmService.confirm({
        title: 'Send for Procurement',
        message: `Send ${request.controlNumber} for supplier procurement? Warehouse stock was insufficient to fulfill it directly.`,
        confirmLabel: 'Send for Procurement',
      });

    if (!confirmed) {
      return;
    }

    this.processingId.set(request.id);

    try {

      await this.service
        .sendForProcurement(
          request.id,
          this.auth.displayName()
        );

      await this.load();

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to send for procurement.'
      );

    } finally {

      this.processingId.set(null);

    }

  }

  async complete(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    const confirmed =
      await this.confirmService.confirm({
        title: 'Complete Procurement',
        message: `Mark procurement for ${request.controlNumber} as completed? This finalizes the procurement step.`,
        confirmLabel: 'Complete Procurement',
      });

    if (!confirmed) {
      return;
    }

    this.processingId.set(request.id);

    try {

      await this.service
        .completeProcurement(
          request.id,
          this.auth.displayName()
        );

      await this.load();

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to complete procurement.'
      );

    } finally {

      this.processingId.set(null);

    }

  }

}
