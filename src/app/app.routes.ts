import {
  Routes
} from '@angular/router';

import {
  Dashboard
} from './pages/dashboard/dashboard';

import {
  PurchaseRequests
} from './pages/purchase-requests/purchase-requests';

import {
  NewPurchaseRequest
} from './pages/new-purchase-request/new-purchase-request';

import {
  RequestDetails
} from './pages/request-details/request-details';

import {
  DmApprovals
} from './pages/dm-approvals/dm-approvals';

import {
  HqConsolidation
} from './pages/hq-consolidation/hq-consolidation';

import {
  Prs
} from './pages/prs/prs';

import {
  Procurement
} from './pages/procurement/procurement';

import {
  PurchaseOrders
} from './pages/purchase-orders/purchase-orders';

import {
  Deliveries
} from './pages/deliveries/deliveries';

import {
  Receiving
} from './pages/receiving/receiving';

import {
  Discrepancies
} from './pages/discrepancies/discrepancies';

import {
  Inventory
} from './pages/inventory/inventory';

import {
  Suppliers
} from './pages/suppliers/suppliers';

import {
  Branches
} from './pages/branches/branches';

import {
  Soa
} from './pages/soa/soa';

import {
  Reports
} from './pages/reports/reports';

import {
  Settings
} from './pages/settings/settings';


export const routes: Routes = [

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: 'dashboard',
    component: Dashboard
  },

  {
    path: 'purchase-requests',
    component: PurchaseRequests
  },

  {
    path: 'purchase-requests/new',
    component: NewPurchaseRequest
  },

  {
    path: 'purchase-requests/:id',
    component: RequestDetails
  },

  {
    path: 'dm-approvals',
    component: DmApprovals
  },

  {
    path: 'hq-consolidation',
    component: HqConsolidation
  },

  {
    path: 'prs',
    component: Prs
  },

  {
    path: 'procurement',
    component: Procurement
  },

  {
    path: 'purchase-orders',
    component: PurchaseOrders
  },

  {
    path: 'deliveries',
    component: Deliveries
  },

  {
    path: 'receiving',
    component: Receiving
  },

  {
    path: 'discrepancies',
    component: Discrepancies
  },

  {
    path: 'inventory',
    component: Inventory
  },

  {
    path: 'suppliers',
    component: Suppliers
  },

  {
    path: 'branches',
    component: Branches
  },

  {
    path: 'soa',
    component: Soa
  },

  {
    path: 'reports',
    component: Reports
  },

  {
    path: 'settings',
    component: Settings
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }

];