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

@Component({
  selector: 'app-hq-consolidation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hq-consolidation.html',
  styleUrl: './hq-consolidation.css'
})
export class HqConsolidation
implements OnInit {

  requests: PurchaseRequest[] = [];

  selected =
    new Set<string>();

  async ngOnInit() {
    await this.load();
  }

  constructor(
    private service:
      SupplyChainService
  ) {}

  async load() {

    this.requests =
      await this.service
        .getRequestsByStatus(
          'DM_APPROVED'
        );

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

    try {

      for (
        const request
        of selectedRequests
      ) {

        await this.service
          .markHQConsolidated(
            request.id!,
            'HQ Supply Officer'
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

    }

  }

}