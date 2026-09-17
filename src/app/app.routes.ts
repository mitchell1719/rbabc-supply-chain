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

import {
  Login
} from './pages/login/login';

import { authGuard, guestGuard } from './guards/auth.guard';

import {
  Help
} from './rb-help/rb-help';

import {
  NotFound
} from './pages/not-found/not-found';


export const routes: Routes = [

  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard]
  },

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },

  {
    path: 'purchase-requests',
    component: PurchaseRequests,
    canActivate: [authGuard]
  },

  {
    path: 'purchase-requests/new',
    component: NewPurchaseRequest,
    canActivate: [authGuard]
  },

  {
    path: 'purchase-requests/:id',
    component: RequestDetails,
    canActivate: [authGuard]
  },

  {
    path: 'dm-approvals',
    component: DmApprovals,
    canActivate: [authGuard]
  },

  {
    path: 'hq-consolidation',
    component: HqConsolidation,
    canActivate: [authGuard]
  },

  {
    path: 'prs',
    component: Prs,
    canActivate: [authGuard]
  },

  {
    path: 'procurement',
    component: Procurement,
    canActivate: [authGuard]
  },

  {
    path: 'purchase-orders',
    component: PurchaseOrders,
    canActivate: [authGuard]
  },

  {
    path: 'deliveries',
    component: Deliveries,
    canActivate: [authGuard]
  },

  {
    path: 'receiving',
    component: Receiving,
    canActivate: [authGuard]
  },

  {
    path: 'discrepancies',
    component: Discrepancies,
    canActivate: [authGuard]
  },

  {
    path: 'inventory',
    component: Inventory,
    canActivate: [authGuard]
  },

  {
    path: 'suppliers',
    component: Suppliers,
    canActivate: [authGuard]
  },

  {
    path: 'branches',
    component: Branches,
    canActivate: [authGuard]
  },

  {
    path: 'soa',
    component: Soa,
    canActivate: [authGuard]
  },

  {
    path: 'reports',
    component: Reports,
    canActivate: [authGuard]
  },

  {
    path: 'settings',
    component: Settings,
    canActivate: [authGuard]
  },

  {
    path: 'help',
    component: Help
  },

  {
    path: '**',
    component: NotFound
  }

];