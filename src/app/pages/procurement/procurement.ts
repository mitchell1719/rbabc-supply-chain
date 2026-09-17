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
  selector: 'app-procurement',
  standalone: true,
  imports: [CommonModule, DataState],
  templateUrl: './procurement.html',
  styleUrl: './procurement.css'
})
export class Procurement
implements OnInit {

  records: PurchaseRequest[] = [];

  loading = false;

  errorMessage = '';

  processingId: string | null = null;

  constructor(
    private service:
      SupplyChainService,

    private auth: AuthService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading = true;

    this.errorMessage = '';

    try {

      this.records =
        await this.service
          .getRequestsByStatuses([
            'PRS_CREATED',
            'WAREHOUSE_CHECK',
            'FOR_PROCUREMENT',
            'PROCUREMENT_COMPLETED'
          ]);

    } catch (error) {

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load procurement records.';

    } finally {

      this.loading = false;

    }

  }

  async procure(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    this.processingId = request.id;

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

      this.processingId = null;

    }

  }

  async complete(
    request: PurchaseRequest
  ) {

    if (!request.id) {
      return;
    }

    this.processingId = request.id;

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

      this.processingId = null;

    }

  }

}
