import {
  Component
} from '@angular/core';

import {
  RouterOutlet
} from '@angular/router';

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

  mobileMenuOpen = false;


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
