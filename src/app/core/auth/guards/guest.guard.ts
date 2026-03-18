import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthSessionService } from '../services/auth-session.service';

export const guestGuard: CanActivateFn = () => {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);

  if (!authSessionService.isBrowser) {
    return true;
  }

  return authSessionService.ensureAuthenticated().pipe(
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return true;
      }

      return router.createUrlTree(['/']);
    }),
  );
};
