import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  PRS as PRSRecord,
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
  selector: 'app-prs',
  standalone: true,
  imports: [CommonModule, DataState, LastUpdated, CopyButton],
  templateUrl: './prs.html',
  styleUrl: './prs.css'
})
export class Prs implements OnInit {

  readonly pending = signal<PurchaseRequest[]>([]);

  readonly prsRecords = signal<PRSRecord[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly generatingId = signal<string | null>(null);

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

      const [pending, prsRecords] = await Promise.all([
        this.service.getRequestsByStatus('HQ_CONSOLIDATED'),
        this.service.getPRS(),
      ]);

      this.pending.set(pending);

      this.prsRecords.set(prsRecords);

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load PRS data.'
      );

    } finally {

      this.loading.set(false);

    }

  }

  async generate(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    const confirmed =
      await this.confirmService.confirm({
        title: 'Generate PRS',
        message: `Generate a Purchase Requisition Slip for ${request.controlNumber}?`,
        confirmLabel: 'Generate PRS',
      });

    if (!confirmed) {
      return;
    }

    this.generatingId.set(request.id);

    try {

      await this.service
        .createPRSFromRequest(
          request,
          this.auth.displayName()
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

    } finally {

      this.generatingId.set(null);

    }

  }

}
