import {
  Routes
} from '@angular/router';

import { authGuard, guestGuard } from './guards/auth.guard';

/**
 * Every page is lazy-loaded: the initial bundle only ships the app shell
 * (sidebar, header, auth) instead of all eighteen pages' code up front.
 * Angular preloads the rest in the background after first paint (see
 * withPreloading in app.config.ts), so first load is fast and in-app
 * navigation still feels instant.
 */
export const routes: Routes = [

  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    canActivate: [guestGuard]
  },

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard]
  },

  {
    path: 'purchase-requests',
    loadComponent: () =>
      import('./pages/purchase-requests/purchase-requests').then((m) => m.PurchaseRequests),
    canActivate: [authGuard]
  },

  {
    path: 'purchase-requests/new',
    loadComponent: () =>
      import('./pages/new-purchase-request/new-purchase-request').then(
        (m) => m.NewPurchaseRequest,
      ),
    canActivate: [authGuard]
  },

  {
    path: 'purchase-requests/:id',
    loadComponent: () =>
      import('./pages/request-details/request-details').then((m) => m.RequestDetails),
    canActivate: [authGuard]
  },

  {
    path: 'dm-approvals',
    loadComponent: () => import('./pages/dm-approvals/dm-approvals').then((m) => m.DmApprovals),
    canActivate: [authGuard]
  },

  {
    path: 'hq-consolidation',
    loadComponent: () =>
      import('./pages/hq-consolidation/hq-consolidation').then((m) => m.HqConsolidation),
    canActivate: [authGuard]
  },

  {
    path: 'prs',
    loadComponent: () => import('./pages/prs/prs').then((m) => m.Prs),
    canActivate: [authGuard]
  },

  {
    path: 'procurement',
    loadComponent: () => import('./pages/procurement/procurement').then((m) => m.Procurement),
    canActivate: [authGuard]
  },

  {
    path: 'purchase-orders',
    loadComponent: () =>
      import('./pages/purchase-orders/purchase-orders').then((m) => m.PurchaseOrders),
    canActivate: [authGuard]
  },

  {
    path: 'deliveries',
    loadComponent: () => import('./pages/deliveries/deliveries').then((m) => m.Deliveries),
    canActivate: [authGuard]
  },

  {
    path: 'receiving',
    loadComponent: () => import('./pages/receiving/receiving').then((m) => m.Receiving),
    canActivate: [authGuard]
  },

  {
    path: 'discrepancies',
    loadComponent: () =>
      import('./pages/discrepancies/discrepancies').then((m) => m.Discrepancies),
    canActivate: [authGuard]
  },

  {
    path: 'inventory',
    loadComponent: () => import('./pages/inventory/inventory').then((m) => m.Inventory),
    canActivate: [authGuard]
  },

  {
    path: 'suppliers',
    loadComponent: () => import('./pages/suppliers/suppliers').then((m) => m.Suppliers),
    canActivate: [authGuard]
  },

  {
    path: 'branches',
    loadComponent: () => import('./pages/branches/branches').then((m) => m.Branches),
    canActivate: [authGuard]
  },

  {
    path: 'soa',
    loadComponent: () => import('./pages/soa/soa').then((m) => m.Soa),
    canActivate: [authGuard]
  },

  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
    canActivate: [authGuard]
  },

  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
    canActivate: [authGuard]
  },

  {
    path: 'help',
    loadComponent: () => import('./rb-help/rb-help').then((m) => m.Help)
  },

  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound)
  }

];
