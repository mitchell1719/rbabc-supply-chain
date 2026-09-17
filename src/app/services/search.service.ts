import { Injectable } from '@angular/core';

import { SupplyChainService } from './supply-chain.service';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  route: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(private service: SupplyChainService) {}

  async search(term: string): Promise<SearchResult[]> {
    const keyword = term.trim().toLowerCase();

    if (!keyword) {
      return [];
    }

    const [requests, branches, suppliers, deliveries, purchaseOrders, soaRecords] =
      await Promise.all([
        this.service.getPurchaseRequests(),
        this.service.getBranches(),
        this.service.getSuppliers(),
        this.service.getDeliveries(),
        this.service.getPurchaseOrders(),
        this.service.getSOA(),
      ]);

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
      if (this.matches(keyword, supplier['name'], supplier['contactPerson'], supplier['email'])) {
        results.push({
          id: supplier.id,
          title: supplier['name'] ?? 'Supplier',
          subtitle: `Supplier • ${supplier['contactPerson'] ?? ''}`,
          category: 'Suppliers',
          route: ['/suppliers'],
        });
      }
    }

    for (const delivery of deliveries) {
      if (this.matches(keyword, delivery['deliveryNumber'], delivery['branchName'], delivery['status'])) {
        results.push({
          id: delivery.id,
          title: delivery['deliveryNumber'] ?? 'Delivery',
          subtitle: `Delivery • ${delivery['branchName'] ?? ''}`,
          category: 'Deliveries',
          route: ['/deliveries'],
        });
      }
    }

    for (const po of purchaseOrders) {
      if (this.matches(keyword, po['poNumber'], po['supplierName'], po['reference'])) {
        results.push({
          id: po.id,
          title: po['poNumber'] ?? 'Purchase Order',
          subtitle: `Purchase Order • ${po['supplierName'] ?? ''}`,
          category: 'Purchase Orders',
          route: ['/purchase-orders'],
        });
      }
    }

    for (const soa of soaRecords) {
      if (this.matches(keyword, soa['soaNumber'], soa['districtManagerName'], soa['branchName'])) {
        results.push({
          id: soa.id,
          title: soa['soaNumber'] ?? 'SOA',
          subtitle: `Statement of Account • ${soa['districtManagerName'] ?? ''}`,
          category: 'SOA',
          route: ['/soa'],
        });
      }
    }

    return results.slice(0, 30);
  }

  private matches(keyword: string, ...fields: Array<string | undefined | null>): boolean {
    return fields.some((field) => field?.toLowerCase().includes(keyword));
  }
}
