import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../services/auth-session.service';

export const guestGuard: CanActivateFn = () => {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);

  if (!authSessionService.isBrowser) {
    return true;
  }

  if (!authSessionService.hasValidAccessToken(0)) {
    return true;
  }

  return router.createUrlTree(['/']);
};
