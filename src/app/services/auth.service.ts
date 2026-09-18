import { Injectable, signal } from '@angular/core';

import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';

import { auth } from '../config/firebase.config';

import { AppUser, UserProfile, UserRole } from '../models/supply-chain.model';

import { UserService } from './user.service';

import { roleCanAccess } from '../config/roles.config';

function toAppUser(user: User | null): AppUser | null {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

function describeAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact your administrator.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled for this project. In the Firebase Console, go to Authentication → Sign-in method and enable the Email/Password provider.';
    case 'auth/configuration-not-found':
      return 'Firebase Authentication has not been set up for this project yet. In the Firebase Console, open Authentication, click Get Started, then enable the Email/Password sign-in provider.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /* =====================================
     REACTIVE AUTH STATE
  ===================================== */

  private readonly userSignal = signal<AppUser | null>(null);

  private readonly profileSignal = signal<UserProfile | null>(null);

  private readonly readySignal = signal<boolean>(false);

  readonly user = this.userSignal.asReadonly();

  /** The signed-in user's role/assignment record, or null while unresolved or signed out. */
  readonly profile = this.profileSignal.asReadonly();

  readonly ready = this.readySignal.asReadonly();

  private readonly readyPromise: Promise<AppUser | null>;

  constructor(private users: UserService) {
    let resolveReady!: (user: AppUser | null) => void;

    this.readyPromise = new Promise((resolve) => {
      resolveReady = resolve;
    });

    onAuthStateChanged(auth, (firebaseUser) => {
      const appUser = toAppUser(firebaseUser);

      this.userSignal.set(appUser);

      (async () => {
        if (appUser) {
          const profile = await this.users.getProfile(appUser.uid).catch(() => null);

          this.profileSignal.set(profile);
        } else {
          this.profileSignal.set(null);
        }

        this.readySignal.set(true);

        resolveReady(appUser);
      })();
    });
  }

  /** Resolves once the initial Firebase auth state (and role profile, if any) has been determined. */
  waitUntilReady(): Promise<AppUser | null> {
    return this.readyPromise;
  }

  isAuthenticated(): boolean {
    return this.userSignal() !== null;
  }

  /** Best-effort display name for attributing actions performed by the current user. */
  displayName(): string {
    const current = this.userSignal();

    return current?.displayName || current?.email || 'Unknown User';
  }

  /**
   * Get-or-create the current user's role profile. Accounts that predate the
   * user-access feature (no `users/{uid}` doc yet) are provisioned as
   * SUPPLY_DIRECTOR so existing users don't lose access to functionality
   * they already relied on; new sign-ups are provisioned as NURSE by
   * signUp() itself before this ever runs for them (see signUp() below).
   */
  async ensureProfileProvisioned(): Promise<UserProfile | null> {
    const current = this.userSignal();

    if (!current) {
      return null;
    }

    if (this.profileSignal()) {
      return this.profileSignal();
    }

    const profile = await this.users.ensureProfile(
      current.uid,
      current.email,
      current.displayName,
      'SUPPLY_DIRECTOR',
    );

    this.profileSignal.set(profile);

    return profile;
  }

  /** Whether the signed-in user's role is in `allowed` (SUPPLY_DIRECTOR always passes). */
  hasAnyRole(allowed: UserRole[]): boolean {
    return roleCanAccess(this.profileSignal()?.role, allowed);
  }

  /**
   * Whether the signed-in user may view/edit data scoped to `branchId`.
   * A Nurse is limited to their own assigned branch; every other role
   * (RNS, District Manager, Supply Officer, Supply Chain Director) works
   * across branches, so only a Nurse account is actually restricted here.
   */
  canAccessBranch(branchId: string): boolean {
    const profile = this.profileSignal();

    if (!profile) {
      return false;
    }

    if (profile.role !== 'NURSE') {
      return true;
    }

    return !!profile.branchId && profile.branchId === branchId;
  }

  /* =====================================
     SIGN IN / SIGN UP / SIGN OUT
  ===================================== */

  async signIn(email: string, password: string): Promise<AppUser> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);

      return toAppUser(credential.user)!;
    } catch (error) {
      throw new Error(describeAuthError(error));
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<AppUser> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

      if (displayName.trim()) {
        await updateProfile(credential.user, { displayName: displayName.trim() });
      }

      const appUser: AppUser = {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: displayName.trim() || credential.user.displayName,
      };

      this.userSignal.set(appUser);

      // Provision the role profile before returning: new sign-ups start as
      // Nurse (branch user), the least-privileged role, and must be
      // promoted by a Supply Officer/Director via the User Access page.
      const profile = await this.users.ensureProfile(
        appUser.uid,
        appUser.email,
        appUser.displayName,
        'NURSE',
      );

      this.profileSignal.set(profile);

      return appUser;
    } catch (error) {
      throw new Error(describeAuthError(error));
    }
  }

  async logOut(): Promise<void> {
    await signOut(auth);
  }

  /** Re-authenticates with the current password, then sets a new one. */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const current = auth.currentUser;

    if (!current || !current.email) {
      throw new Error('You must be signed in to change your password.');
    }

    try {
      const credential = EmailAuthProvider.credential(current.email, currentPassword);

      await reauthenticateWithCredential(current, credential);

      await updatePassword(current, newPassword);
    } catch (error) {
      throw new Error(describeAuthError(error));
    }
  }
}
