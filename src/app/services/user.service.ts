import { Injectable } from '@angular/core';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../config/firebase.config';

import { UserProfile, UserRole } from '../models/supply-chain.model';

import { AuditService, AuditActor } from './audit.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private audit: AuditService) {}

  /** Wraps a Firestore call so every failure surfaces a consistent, readable error. */
  private async withErrorHandling<T>(action: string, task: () => Promise<T>): Promise<T> {
    try {
      return await task();
    } catch (error) {
      console.error(`${action} failed:`, error);

      if (error instanceof Error && error.message) {
        throw new Error(error.message);
      }

      throw new Error(`Unable to ${action.toLowerCase()}. Please try again.`);
    }
  }

  /** Reads a user's role profile, or null if one hasn't been provisioned yet. */
  async getProfile(uid: string): Promise<UserProfile | null> {
    return this.withErrorHandling('Load user profile', async () => {
      const snapshot = await getDoc(doc(db, 'users', uid));

      if (!snapshot.exists()) {
        return null;
      }

      return { uid, ...snapshot.data() } as UserProfile;
    });
  }

  /**
   * Get-or-create: returns the existing profile if one exists, otherwise
   * provisions a new one with `defaultRole`. Never overwrites an existing
   * profile, so this is safe to call opportunistically (e.g. on sign-in).
   */
  async ensureProfile(
    uid: string,
    email: string | null,
    displayName: string | null,
    defaultRole: UserRole,
  ): Promise<UserProfile> {
    return this.withErrorHandling('Provision user profile', async () => {
      const existing = await this.getProfile(uid);

      if (existing) {
        return existing;
      }

      const profile: Omit<UserProfile, 'uid'> = {
        email,
        displayName,
        role: defaultRole,
        branchId: '',
        branchName: '',
        active: true,
      };

      await setDoc(doc(db, 'users', uid), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(
        { uid, displayName: displayName || email || uid, role: defaultRole },
        'CREATE',
        'user',
        uid,
        `Account provisioned with role ${defaultRole}`,
      );

      return { uid, ...profile };
    });
  }

  /** All user accounts, for the User Access management page. */
  async getUsers(): Promise<UserProfile[]> {
    return this.withErrorHandling('Load users', async () => {
      const snapshot = await getDocs(collection(db, 'users'));

      const users = snapshot.docs.map(
        (document) => ({ uid: document.id, ...document.data() }) as UserProfile,
      );

      users.sort((a, b) =>
        (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''),
      );

      return users;
    });
  }

  async updateUserRole(
    uid: string,
    role: UserRole,
    branchId: string,
    branchName: string,
    actor: AuditActor,
  ): Promise<void> {
    return this.withErrorHandling('Update user role', async () => {
      await updateDoc(doc(db, 'users', uid), {
        role,
        branchId,
        branchName,
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(
        actor,
        'UPDATE',
        'user',
        uid,
        `Role changed to ${role}${branchName ? ` (branch: ${branchName})` : ''}`,
      );
    });
  }

  async setUserActive(uid: string, active: boolean, actor: AuditActor): Promise<void> {
    return this.withErrorHandling('Update user status', async () => {
      await updateDoc(doc(db, 'users', uid), {
        active,
        updatedAt: serverTimestamp(),
      });

      await this.audit.log(actor, 'UPDATE', 'user', uid, active ? 'Account activated' : 'Account disabled');
    });
  }
}
