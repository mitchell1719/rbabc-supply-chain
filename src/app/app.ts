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


@Component({

  selector: 'app-root',

  standalone: true,

  imports: [
    CommonModule,
    RouterOutlet,
    Sidebar,
    Header
  ],

  templateUrl:
    './app.html',

  styleUrl:
    './app.css'

})
export class App {

  sidebarCollapsed = false;

  showShell = true;

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

}
