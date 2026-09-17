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

import { AuthService } from '../../services/auth.service';

import {
  APPROVAL_ROLES,
  PROCUREMENT_ROLES,
  REFERENCE_DATA_ROLES,
  RNS_REVIEW_ROLES,
  USER_MANAGEMENT_ROLES,
} from '../../config/roles.config';


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

  constructor(private auth: AuthService) {}

  get canReviewAsRns(): boolean {
    return this.auth.hasAnyRole(RNS_REVIEW_ROLES);
  }

  get canApprove(): boolean {
    return this.auth.hasAnyRole(APPROVAL_ROLES);
  }

  get canManageProcurement(): boolean {
    return this.auth.hasAnyRole(PROCUREMENT_ROLES);
  }

  get canManageReferenceData(): boolean {
    return this.auth.hasAnyRole(REFERENCE_DATA_ROLES);
  }

  get canManageUsers(): boolean {
    return this.auth.hasAnyRole(USER_MANAGEMENT_ROLES);
  }

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