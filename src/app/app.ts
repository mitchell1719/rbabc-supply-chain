import {
  Component
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterOutlet
} from '@angular/router';

import { CommonModule } from '@angular/common';

import { filter } from 'rxjs/operators';

import {
  Sidebar
} from './components/sidebar/sidebar';

import {
  Header
} from './components/header/header';

import {
  ScrollProgress
} from './components/scroll-progress/scroll-progress';

import {
  BackToTop
} from './components/back-to-top/back-to-top';

import {
  CookieBanner
} from './components/cookie-banner/cookie-banner';

import {
  ContactFab
} from './components/contact-fab/contact-fab';

import {
  ConfirmDialog
} from './confirm-dialog/confirm-dialog';

import {
  SearchOverlay
} from './components/search-overlay/search-overlay';


@Component({

  selector: 'app-root',

  standalone: true,

  imports: [
    CommonModule,
    RouterOutlet,
    Sidebar,
    Header,
    ScrollProgress,
    BackToTop,
    CookieBanner,
    ContactFab,
    ConfirmDialog,
    SearchOverlay
  ],

  templateUrl:
    './app.html',

  styleUrl:
    './app.css'

})
export class App {

  sidebarCollapsed = false;

  showShell = true;

  mobileMenuOpen = false;

  constructor(private router: Router) {
    this.showShell = !this.router.url.startsWith('/login');

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.showShell = !event.urlAfterRedirects.startsWith('/login');
      });
  }

  sidebarChanged(
    collapsed: boolean
  ) {

    this.sidebarCollapsed =
      collapsed;

  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  setMobileMenu(open: boolean) {
    this.mobileMenuOpen = open;
  }

}
