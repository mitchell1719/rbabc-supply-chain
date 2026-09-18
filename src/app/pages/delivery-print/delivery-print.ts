import { Component, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { SupplyChainService } from '../../services/supply-chain.service';
import { ExportService } from '../../services/export.service';

import { DeliveryNote } from '../../models/supply-chain.model';

import { DocumentLetterhead } from '../../components/document-letterhead/document-letterhead';
import { DataState } from '../../components/data-state/data-state';

/** Printable Delivery Note, matching RB-ABC's official Central Warehouse paper form layout. */
@Component({
  selector: 'app-delivery-print',
  standalone: true,
  imports: [CommonModule, RouterLink, DocumentLetterhead, DataState],
  templateUrl: './delivery-print.html',
  styleUrl: './delivery-print.css',
})
export class DeliveryPrint implements OnInit {
  readonly delivery = signal<DeliveryNote | null>(null);

  readonly prsDate = signal('');

  readonly loading = signal(true);

  readonly errorMessage = signal('');

  constructor(
    private route: ActivatedRoute,
    private service: SupplyChainService,
    private exportService: ExportService,
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage.set('No delivery note was specified.');
      this.loading.set(false);
      return;
    }

    await this.load(id);
  }

  async load(id: string) {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const delivery = await this.service.getDeliveryById(id);

      if (!delivery) {
        this.errorMessage.set('Delivery note not found.');
        return;
      }

      this.delivery.set(delivery);

      if (delivery.prsId) {
        const prs = await this.service.getPRSById(delivery.prsId);

        this.prsDate.set(prs?.date || '');
      }
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to load the delivery note.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  retry() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.load(id);
    }
  }

  print() {
    this.exportService.exportToPdf();
  }
}
