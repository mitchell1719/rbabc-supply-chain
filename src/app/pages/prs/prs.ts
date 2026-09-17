import {
  Component,
  OnInit
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

  pending: PurchaseRequest[] = [];

  prsRecords: PRSRecord[] = [];

  loading = false;

  errorMessage = '';

  generatingId: string | null = null;

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

    this.loading = true;

    this.errorMessage = '';

    try {

      const [pending, prsRecords] = await Promise.all([
        this.service.getRequestsByStatus('HQ_CONSOLIDATED'),
        this.service.getPRS(),
      ]);

      this.pending = pending;

      this.prsRecords = prsRecords;

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load PRS data.';

    } finally {

      this.loading = false;

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

    this.generatingId = request.id;

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

      this.generatingId = null;

    }

  }

}
