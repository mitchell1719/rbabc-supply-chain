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


@Component({

  selector: 'app-root',

  standalone: true,

  imports: [
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


  sidebarChanged(
    collapsed: boolean
  ) {

    this.sidebarCollapsed =
      collapsed;

  }

}