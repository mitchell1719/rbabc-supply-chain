import {
  Component,
  EventEmitter,
  Output
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';


@Component({

  selector:
    'app-sidebar',

  standalone:
    true,

  imports: [
    RouterLink,
    RouterLinkActive
  ],

  templateUrl:
    './sidebar.html',

  styleUrl:
    './sidebar.css'

})
export class Sidebar {

  collapsed = false;


  @Output()
  collapseChange =
    new EventEmitter<boolean>();


  toggleSidebar() {

    this.collapsed =
      !this.collapsed;

    this.collapseChange.emit(
      this.collapsed
    );

  }

}