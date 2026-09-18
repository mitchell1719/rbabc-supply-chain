import { Injectable } from '@angular/core';

import { SupplyChainService } from './supply-chain.service';

import {
  Branch,
  DeliveryNote,
  PurchaseOrder,
  PurchaseRequest,
  StatementOfAccount,
  Supplier,
} from '../models/supply-chain.model';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  route: string[];
}

interface SearchIndex {
  requests: PurchaseRequest[];
  branches: Branch[];
  suppliers: Supplier[];
  deliveries: DeliveryNote[];
  purchaseOrders: PurchaseOrder[];
  soaRecords: StatementOfAccount[];
}

/** How long a fetched search index stays fresh before the next search re-fetches it. */
const INDEX_TTL_MS = 30_000;

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private indexCache: SearchIndex | null = null;

  private indexCachedAt = 0;

  private indexPromise: Promise<SearchIndex> | null = null;

  constructor(private service: SupplyChainService) {}

  async search(term: string): Promise<SearchResult[]> {
    const keyword = term.trim().toLowerCase();

    if (!keyword) {
      return [];
    }

    const { requests, branches, suppliers, deliveries, purchaseOrders, soaRecords } =
      await this.loadIndex();

    const results: SearchResult[] = [];

    for (const request of requests) {
      if (this.matches(keyword, request.controlNumber, request.branchName, request.status)) {
        results.push({
          id: request.id ?? request.controlNumber,
          title: request.controlNumber,
          subtitle: `Purchase Request • ${request.branchName ?? ''}`,
          category: 'Purchase Requests',
          route: ['/purchase-requests', request.id ?? ''],
        });
      }
    }

    for (const branch of branches) {
      if (this.matches(keyword, branch.name, branch.headquartersName, branch.districtManagerName)) {
        results.push({
          id: branch.id ?? branch.name,
          title: branch.name,
          subtitle: `Branch • ${branch.region}`,
          category: 'Branches',
          route: ['/branches'],
        });
      }
    }

    for (const supplier of suppliers) {
      if (this.matches(keyword, supplier.name, supplier.contactPerson, supplier.email)) {
        results.push({
          id: supplier.id ?? supplier.name,
          title: supplier.name ?? 'Supplier',
          subtitle: `Supplier • ${supplier.contactPerson ?? ''}`,
          category: 'Suppliers',
          route: ['/suppliers'],
        });
      }
    }

    for (const delivery of deliveries) {
      if (this.matches(keyword, delivery.deliveryNumber, delivery.branchName, delivery.status)) {
        results.push({
          id: delivery.id ?? delivery.deliveryNumber,
          title: delivery.deliveryNumber ?? 'Delivery',
          subtitle: `Delivery • ${delivery.branchName ?? ''}`,
          category: 'Deliveries',
          route: ['/deliveries'],
        });
      }
    }

    for (const po of purchaseOrders) {
      if (this.matches(keyword, po.poNumber, po.supplierName, po.reference)) {
        results.push({
          id: po.id ?? po.poNumber,
          title: po.poNumber ?? 'Purchase Order',
          subtitle: `Purchase Order • ${po.supplierName ?? ''}`,
          category: 'Purchase Orders',
          route: ['/purchase-orders'],
        });
      }
    }

    for (const soa of soaRecords) {
      if (this.matches(keyword, soa.soaNumber, soa.districtManagerName, soa.branchName)) {
        results.push({
          id: soa.id ?? soa.soaNumber,
          title: soa.soaNumber ?? 'SOA',
          subtitle: `Statement of Account • ${soa.districtManagerName ?? ''}`,
          category: 'SOA',
          route: ['/soa'],
        });
      }
    }

    return results.slice(0, 30);
  }

  /**
   * Returns the searchable index, fetching fresh only when the cache is missing,
   * stale, or a caller explicitly forces it. Concurrent callers share one
   * in-flight fetch instead of each triggering their own round trip - this is
   * what keeps typing in the search box from firing six Firestore reads per
   * keystroke.
   */
  private async loadIndex(forceRefresh = false): Promise<SearchIndex> {
    const isFresh = this.indexCache !== null && Date.now() - this.indexCachedAt < INDEX_TTL_MS;

    if (!forceRefresh && isFresh) {
      return this.indexCache!;
    }

    if (!forceRefresh && this.indexPromise) {
      return this.indexPromise;
    }

    this.indexPromise = Promise.all([
      this.service.getPurchaseRequests(),
      this.service.getBranches(),
      this.service.getSuppliers(),
      this.service.getDeliveries(),
      this.service.getPurchaseOrders(),
      this.service.getSOA(),
    ]).then(([requests, branches, suppliers, deliveries, purchaseOrders, soaRecords]) => {
      const index: SearchIndex = { requests, branches, suppliers, deliveries, purchaseOrders, soaRecords };

      this.indexCache = index;
      this.indexCachedAt = Date.now();

      return index;
    });

    try {
      return await this.indexPromise;
    } finally {
      this.indexPromise = null;
    }
  }

  private matches(keyword: string, ...fields: Array<string | undefined | null>): boolean {
    return fields.some((field) => field?.toLowerCase().includes(keyword));
  }
}
