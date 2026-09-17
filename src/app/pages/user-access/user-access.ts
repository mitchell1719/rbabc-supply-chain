import { Component, OnInit, computed, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserService } from '../../services/user.service';
import { SupplyChainService } from '../../services/supply-chain.service';
import { AuthService } from '../../services/auth.service';
import { ConfirmService } from '../../services/confirm.service';

import { Branch, UserProfile, UserRole } from '../../models/supply-chain.model';

import { ROLE_LABELS, ROLE_RESPONSIBILITIES, ALL_ROLES } from '../../config/roles.config';

import { DataState } from '../../components/data-state/data-state';

/** A row's in-progress edit state, separate from the last-saved UserProfile. */
interface UserDraft {
  role: UserRole;
  branchId: string;
  active: boolean;
}

const OFFICER_ASSIGNABLE_ROLES: UserRole[] = ['NURSE', 'RNS', 'DISTRICT_MANAGER'];

@Component({
  selector: 'app-user-access',
  standalone: true,
  imports: [CommonModule, FormsModule, DataState],
  templateUrl: './user-access.html',
  styleUrl: './user-access.css',
})
export class UserAccess implements OnInit {
  readonly users = signal<UserProfile[]>([]);

  readonly branches = signal<Branch[]>([]);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly savingUid = signal<string | null>(null);

  drafts: Record<string, UserDraft> = {};

  readonly roleLabels = ROLE_LABELS;

  readonly roleResponsibilities = ROLE_RESPONSIBILITIES;

  readonly allRoles = ALL_ROLES;

  /** True for a Supply Chain Director, who has unrestricted user-management rights ("Full" in the access matrix). */
  readonly isDirector = computed(() => this.auth.profile()?.role === 'SUPPLY_DIRECTOR');

  constructor(
    private userService: UserService,
    private service: SupplyChainService,
    public auth: AuthService,
    private confirmService: ConfirmService,
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const [users, branches] = await Promise.all([
        this.userService.getUsers(),
        this.service.getBranches(),
      ]);

      this.users.set(users);
      this.branches.set(branches);

      this.drafts = {};

      for (const user of users) {
        this.drafts[user.uid] = {
          role: user.role,
          branchId: user.branchId || '',
          active: user.active,
        };
      }
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Unable to load user accounts.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  /** A Supply Officer ("Limited" access) may only assign the branch-level roles; a Director may assign any role. */
  assignableRoles(): UserRole[] {
    return this.isDirector() ? ALL_ROLES : OFFICER_ASSIGNABLE_ROLES;
  }

  /**
   * A Supply Officer cannot edit their own peers (other Officers) or
   * Directors, and can never edit their own account (self-demotion guard).
   * A Director can edit anyone except themselves.
   */
  canEditRow(user: UserProfile): boolean {
    if (user.uid === this.auth.user()?.uid) {
      return false;
    }

    if (this.isDirector()) {
      return true;
    }

    return user.role !== 'SUPPLY_OFFICER' && user.role !== 'SUPPLY_DIRECTOR';
  }

  branchRequired(uid: string): boolean {
    return this.drafts[uid]?.role === 'NURSE';
  }

  isDirty(user: UserProfile): boolean {
    const draft = this.drafts[user.uid];

    if (!draft) {
      return false;
    }

    return (
      draft.role !== user.role ||
      draft.branchId !== (user.branchId || '') ||
      draft.active !== user.active
    );
  }

  async save(user: UserProfile) {
    const draft = this.drafts[user.uid];

    if (!draft || !this.canEditRow(user)) {
      return;
    }

    if (draft.role === 'NURSE' && !draft.branchId) {
      alert('Select the branch this Nurse account represents.');
      return;
    }

    const branch = this.branches().find((b) => b.id === draft.branchId);

    const confirmed = await this.confirmService.confirm({
      title: 'Update User Access',
      message: `Update ${user.displayName || user.email}'s role to ${this.roleLabels[draft.role]}?`,
      confirmLabel: 'Update Access',
    });

    if (!confirmed) {
      return;
    }

    this.savingUid.set(user.uid);

    try {
      await this.userService.updateUserRole(
        user.uid,
        draft.role,
        draft.role === 'NURSE' ? draft.branchId : '',
        draft.role === 'NURSE' ? branch?.name || '' : '',
      );

      if (draft.active !== user.active) {
        await this.userService.setUserActive(user.uid, draft.active);
      }

      await this.load();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to update user access.');
    } finally {
      this.savingUid.set(null);
    }
  }
}
