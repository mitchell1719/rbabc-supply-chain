import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Blocks navigation to protected pages until a signed-in user is confirmed. */
export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);

  const router = inject(Router);

  await auth.waitUntilReady();

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

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
