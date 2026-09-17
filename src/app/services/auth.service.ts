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

import { AppUser } from '../models/supply-chain.model';

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

  private readonly readySignal = signal<boolean>(false);

  readonly user = this.userSignal.asReadonly();

  readonly ready = this.readySignal.asReadonly();

  private readonly readyPromise: Promise<AppUser | null>;

  constructor() {
    let resolveReady!: (user: AppUser | null) => void;

    this.readyPromise = new Promise((resolve) => {
      resolveReady = resolve;
    });

    onAuthStateChanged(auth, (firebaseUser) => {
      const appUser = toAppUser(firebaseUser);

      this.userSignal.set(appUser);

      this.readySignal.set(true);

      resolveReady(appUser);
    });
  }

  /** Resolves once the initial Firebase auth state has been determined. */
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
