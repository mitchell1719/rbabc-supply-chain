import {
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  PurchaseRequest
} from '../../models/supply-chain.model';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  DataState
} from '../../components/data-state/data-state';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-hq-consolidation',
  standalone: true,
  imports: [CommonModule, DataState],
  templateUrl: './hq-consolidation.html',
  styleUrl: './hq-consolidation.css'
})
export class HqConsolidation
implements OnInit {

  requests: PurchaseRequest[] = [];

  selected =
    new Set<string>();

  loading = false;

  errorMessage = '';

  consolidating = false;

  async ngOnInit() {
    await this.load();
  }

  constructor(
    private service:
      SupplyChainService,

    private auth: AuthService
  ) {}

  async load() {

    this.loading = true;

    this.errorMessage = '';

    try {

      this.requests =
        await this.service
          .getRequestsByStatus(
            'DM_APPROVED'
          );

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load DM-approved requests.';

    } finally {

      this.loading = false;

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
      this.requests.filter(
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
      confirm(
        `Consolidate ${selectedRequests.length} request(s)?`
      );

    if (!confirmed) {
      return;
    }

    this.consolidating = true;

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

      this.consolidating = false;

    }

  }

}
