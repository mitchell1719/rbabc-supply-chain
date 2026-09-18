import { Component, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { SupplyChainService } from '../../services/supply-chain.service';
import { ExportService } from '../../services/export.service';

import { PRS } from '../../models/supply-chain.model';

import { DocumentLetterhead } from '../../components/document-letterhead/document-letterhead';
import { DataState } from '../../components/data-state/data-state';

/** Printable Purchase Requisition Slip, matching RB-ABC's official paper form layout. */
@Component({
  selector: 'app-prs-print',
  standalone: true,
  imports: [CommonModule, RouterLink, DocumentLetterhead, DataState],
  templateUrl: './prs-print.html',
  styleUrl: './prs-print.css',
})
export class PrsPrint implements OnInit {
  readonly prs = signal<PRS | null>(null);

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
      this.errorMessage.set('No PRS was specified.');
      this.loading.set(false);
      return;
    }

    await this.load(id);
  }

  async load(id: string) {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const prs = await this.service.getPRSById(id);

      if (!prs) {
        this.errorMessage.set('PRS not found.');
        return;
      }

      // Records generated before branchName/department were added to the
      // PRS document fall back to the originating purchase request.
      if (!prs.branchName && prs.purchaseRequestIds[0]) {
        const request = await this.service.getPurchaseRequest(prs.purchaseRequestIds[0]);

        if (request) {
          prs.branchName = request.branchName;
          prs.department = request.department;
        }
      }

      this.prs.set(prs);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to load the PRS.',
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
