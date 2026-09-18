import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

import { UserRole } from '../models/supply-chain.model';

/** Resolves once a signed-in user's auth state and role profile are both settled. */
async function ensureReady(auth: AuthService): Promise<void> {
  await auth.waitUntilReady();

  if (auth.isAuthenticated()) {
    // Guarantees a role profile exists (creating one for accounts that
    // predate the user-access feature) before any role check runs.
    await auth.ensureProfileProvisioned();
  }
}

/** Blocks navigation to protected pages until a signed-in user is confirmed. */
export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);

  const router = inject(Router);

  await ensureReady(auth);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  return true;
};

/**
 * Route guard factory restricting a page to specific roles. Angular runs a
 * route's canActivate guards concurrently rather than sequentially, so this
 * cannot assume authGuard has already resolved the role profile - it awaits
 * readiness itself. SUPPLY_DIRECTOR always passes (full system access).
 */
export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);

    const router = inject(Router);

    await ensureReady(auth);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (auth.hasAnyRole(allowedRoles)) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  };
}

/** Keeps signed-in users away from the login page. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);

  const router = inject(Router);

  await auth.waitUntilReady();

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
