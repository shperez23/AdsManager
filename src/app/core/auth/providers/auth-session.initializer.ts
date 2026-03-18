import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { catchError, firstValueFrom, map, of } from 'rxjs';

import { AuthSessionService } from '../services/auth-session.service';

export function provideAuthSessionInitializer(): EnvironmentProviders {
  return provideAppInitializer(async () => {
    const authSessionService = inject(AuthSessionService);

    await firstValueFrom(
      authSessionService.ensureAuthenticated().pipe(
        map(() => undefined),
        catchError(() => of(undefined)),
      ),
    );
  });
}
