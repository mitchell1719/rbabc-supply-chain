import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

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
    CommonModule,
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

  @Input()
  mobileOpen = false;


  @Output()
  collapseChange =
    new EventEmitter<boolean>();

  @Output()
  mobileOpenChange =
    new EventEmitter<boolean>();


  toggleSidebar() {

    this.collapsed =
      !this.collapsed;

    this.collapseChange.emit(
      this.collapsed
    );

  }

  closeMobile() {
    this.mobileOpenChange.emit(false);
  }

  onNavClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.closest('a')) {
      this.closeMobile();
    }
  }

}