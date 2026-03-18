import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GuardResult, Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';

import { AuthSessionService } from '../services/auth-session.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authSessionService: jasmine.SpyObj<AuthSessionService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authSessionService = jasmine.createSpyObj<AuthSessionService>(
      'AuthSessionService',
      ['ensureAuthenticated'],
      { isBrowser: true },
    );
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthSessionService, useValue: authSessionService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('should allow access during server-side evaluation', () => {
    Object.defineProperty(authSessionService, 'isBrowser', { value: false });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/reports' } as never),
    );

    expect(result).toBeTrue();
    expect(authSessionService.ensureAuthenticated).not.toHaveBeenCalled();
  });

  it('should allow access when the session can be ensured', async () => {
    authSessionService.ensureAuthenticated.and.returnValue(of(true));

    const result = TestBed.runInInjectionContext(
      () => authGuard({} as never, { url: '/' } as never),
    ) as Observable<GuardResult>;

    expect(await firstValueFrom(result)).toBeTrue();
    expect(authSessionService.ensureAuthenticated).toHaveBeenCalledOnceWith();
  });

  it('should redirect to login with the requested returnUrl when unauthenticated', async () => {
    const redirectTree = {} as ReturnType<Router['createUrlTree']>;
    authSessionService.ensureAuthenticated.and.returnValue(of(false));
    router.createUrlTree.and.returnValue(redirectTree);

    const result = TestBed.runInInjectionContext(
      () => authGuard({} as never, { url: '/reports' } as never),
    ) as Observable<GuardResult>;

    expect(await firstValueFrom(result)).toBe(redirectTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/reports' },
    });
  });
});
