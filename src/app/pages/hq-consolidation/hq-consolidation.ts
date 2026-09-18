import {
  Component,
  OnInit,
  computed,
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

  readonly selected = signal(new Set<string>());

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly consolidating = signal(false);

  /**
   * Item-description breakdown for the consolidation batch: total quantity
   * and number of distinct requests ("orders") referencing each description.
   * Scoped to the checked requests once something is selected (since a
   * consolidation batch must share one HQ), otherwise covers every request
   * currently awaiting consolidation, so the admin always has a summary to
   * work from before generating the PRS.
   */
  readonly itemSummary = computed(() => {
    const selectedIds = this.selected();

    const scope = selectedIds.size > 0
      ? this.requests().filter((r) => r.id && selectedIds.has(r.id))
      : this.requests();

    const byDescription = new Map<
      string,
      { description: string; unit: string; totalQuantity: number; totalCost: number; orderCount: number }
    >();

    for (const request of scope) {
      for (const item of request.items) {
        const key = item.description.trim().toLowerCase();

        const existing = byDescription.get(key);

        if (existing) {
          existing.totalQuantity += Number(item.quantity) || 0;
          existing.totalCost += Number(item.totalCost) || 0;
          existing.orderCount += 1;
        } else {
          byDescription.set(key, {
            description: item.description,
            unit: item.unit,
            totalQuantity: Number(item.quantity) || 0,
            totalCost: Number(item.totalCost) || 0,
            orderCount: 1,
          });
        }
      }
    }

    return Array.from(byDescription.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  });

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
          .getRequestsByStatuses([
            'RECEIVED_BY_HQ',
            'DM_APPROVED'
          ])
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load requests awaiting HQ consolidation.'
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

    const next = new Set(this.selected());

    if (next.has(request.id)) {
      next.delete(request.id);
    } else {
      next.add(request.id);
    }

    this.selected.set(next);

  }

  isSelected(request: PurchaseRequest): boolean {
    return !!request.id && this.selected().has(request.id);
  }

  async consolidate() {

    const selectedIds = this.selected();

    if (
      selectedIds.size === 0
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
          selectedIds.has(r.id)
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

      this.selected.set(new Set());

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
