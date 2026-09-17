import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  ConfirmService
} from '../../services/confirm.service';

import {
  PurchaseRequest
} from '../../models/supply-chain.model';

import {
  StatusBadge
} from '../../components/status-badge/status-badge';

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

/**
 * Regional Nurse Supervisor review queue: validates branch purchase
 * requests before they reach District Manager approval, matching the
 * RNS step in the RB ABC branch procurement workflow.
 */
@Component({
  selector: 'app-rns-review',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadge,
    DataState,
    LastUpdated,
    CopyButton
  ],
  templateUrl: './rns-review.html',
  styleUrl: './rns-review.css'
})
export class RnsReview implements OnInit {

  readonly requests = signal<PurchaseRequest[]>([]);

  comments: Record<string, string> = {};

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly processingId = signal<string | null>(null);

  constructor(
    private service: SupplyChainService,

    private confirmService: ConfirmService,

    private auth: AuthService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      this.requests.set(
        await this.service.getRequestsByStatus(
          'PENDING_RNS_REVIEW'
        )
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load requests pending RNS review.'
      );

    } finally {

      this.loading.set(false);

    }

  }

  async endorse(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    const confirmed =
      await this.confirmService.confirm({
        title: 'Endorse Purchase Request',
        message: `Endorse ${request.controlNumber}? This will forward it to the District Manager for approval.`,
        confirmLabel: 'Endorse',
      });

    if (!confirmed) {
      return;
    }

    this.processingId.set(request.id);

    try {

      await this.service.endorseByRNS(
        request.id,
        this.auth.displayName(),
        this.comments[request.id] || ''
      );

      await this.load();

    } catch (error: any) {

      alert(
        error?.message ||
        'Unable to endorse request.'
      );

    } finally {

      this.processingId.set(null);

    }

  }

  async returnRequest(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    const reason =
      this.comments[request.id]?.trim();

    if (!reason) {

      alert(
        'Please enter a reason before returning the request.'
      );

      return;
    }

    const confirmed =
      await this.confirmService.confirm({
        title: 'Return for Revision',
        message: `Return ${request.controlNumber} to the branch for revision? This cannot be undone.`,
        confirmLabel: 'Return Request',
        danger: true,
      });

    if (!confirmed) {
      return;
    }

    this.processingId.set(request.id);

    try {

      await this.service.returnForRevision(
        request.id,
        this.auth.displayName(),
        reason
      );

      await this.load();

    } catch (error: any) {

      alert(
        error?.message ||
        'Unable to return request.'
      );

    } finally {

      this.processingId.set(null);

    }

  }

}
