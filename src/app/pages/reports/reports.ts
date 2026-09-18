import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import {
  DeliveryNote,
  Inventory,
  PurchaseRequest
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

import { AuthService } from '../../services/auth.service';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, DataState],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports
implements OnInit {

  readonly requests = signal<PurchaseRequest[]>([]);
  readonly inventory = signal<Inventory[]>([]);
  readonly deliveries = signal<DeliveryNote[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly completed = computed(
    () => this.requests().filter(x => x.status === 'COMPLETED').length
  );

  readonly lowStock = computed(
    () => this.inventory().filter(x => Number(x.quantity) <= Number(x.reorderLevel)).length
  );

  readonly expiringSoon = computed(
    () => this.inventory().filter(
      (item) => this.service.isExpiringSoon(item) && !this.service.isExpired(item),
    ).length
  );

  constructor(
    private service:
      SupplyChainService,

    private auth: AuthService,

    private exportService: ExportService,
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {

    this.loading.set(true);

    this.errorMessage.set('');

    try {

      const profile = this.auth.profile();
      const branchId = profile?.role === 'NURSE' ? profile.branchId : '';

      const [requests, inventory, deliveries] = await Promise.all([
        branchId
          ? this.service.getPurchaseRequestsForBranch(branchId)
          : this.service.getPurchaseRequests(),
        this.service.getInventory(),
        this.service.getDeliveries(),
      ]);

      // A Nurse's report is scoped to their own branch ("Branch Only" in
      // the user-access matrix); inventory and deliveries don't have a
      // per-branch Firestore query, so they're filtered client-side.
      this.requests.set(requests);

      this.inventory.set(
        branchId
          ? inventory.filter((i) => i.locationType === 'BRANCH' && i.locationId === branchId)
          : inventory,
      );

      this.deliveries.set(
        branchId ? deliveries.filter((d) => d.branchId === branchId) : deliveries,
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load report data.'
      );

    } finally {

      this.loading.set(false);

    }

  }

  exportCsv() {
    this.exportService.exportToCsv(
      'supply-chain-report',
      ['Metric', 'Value'],
      [
        ['Total Purchase Requests', this.requests().length],
        ['Completed Requests', this.completed()],
        ['Inventory Records', this.inventory().length],
        ['Low Stock Records', this.lowStock()],
        ['Expiring Within 90 Days', this.expiringSoon()],
        ['Deliveries', this.deliveries().length],
      ],
    );
  }

  exportPdf() {
    this.exportService.exportToPdf();
  }

}
