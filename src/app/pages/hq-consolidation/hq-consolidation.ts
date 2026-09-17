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
  selector: 'app-hq-consolidation',
  standalone: true,
  imports: [CommonModule, DataState, LastUpdated, CopyButton],
  templateUrl: './hq-consolidation.html',
  styleUrl: './hq-consolidation.css'
})
export class HqConsolidation
implements OnInit {

  readonly requests = signal<PurchaseRequest[]>([]);

  selected =
    new Set<string>();

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly consolidating = signal(false);

  async ngOnInit() {
    await this.load();
  }

  constructor(
    private service:
      SupplyChainService,

    private confirmService:
      ConfirmService,

    private auth: AuthService
  ) {}

  async load() {

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      this.requests.set(
        await this.service
          .getRequestsByStatus(
            'DM_APPROVED'
          )
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load DM-approved requests.'
      );

    } finally {

      this.loading.set(false);

    }

  }

  toggle(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    if (
      this.selected.has(request.id)
    ) {

      this.selected.delete(
        request.id
      );

    } else {

      this.selected.add(
        request.id
      );

    }

  }

  async consolidate() {

    if (
      this.selected.size === 0
    ) {

      alert(
        'Select at least one request.'
      );

      return;
    }

    const selectedRequests =
      this.requests().filter(
        r =>
          r.id &&
          this.selected.has(r.id)
      );

    const hqs =
      new Set(
        selectedRequests.map(
          r => r.headquartersId
        )
      );

    if (hqs.size !== 1) {

      alert(
        'A consolidation must contain requests from the same assigned HQ.'
      );

      return;
    }

    const confirmed =
      await this.confirmService.confirm({
        title: 'Consolidate Requests',
        message: `Consolidate ${selectedRequests.length} request(s) into the HQ batch? This will advance their workflow status.`,
        confirmLabel: 'Consolidate',
      });

    if (!confirmed) {
      return;
    }

    this.consolidating.set(true);

    try {

      const performedBy =
        this.auth.displayName();

      for (
        const request
        of selectedRequests
      ) {

        await this.service
          .markHQConsolidated(
            request.id!,
            performedBy
          );

      }

      this.selected.clear();

      await this.load();

      alert(
        'HQ consolidation completed.'
      );

    } catch (error: any) {

      alert(
        error?.message ||
        'Unable to consolidate requests.'
      );

    } finally {

      this.consolidating.set(false);

    }

  }

}
