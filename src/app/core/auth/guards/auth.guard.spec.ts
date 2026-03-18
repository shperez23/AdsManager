import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthSessionService } from '../services/auth-session.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authSessionService: jasmine.SpyObj<AuthSessionService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authSessionService = jasmine.createSpyObj<AuthSessionService>(
      'AuthSessionService',
      ['hasValidAccessToken'],
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
    expect(authSessionService.hasValidAccessToken).not.toHaveBeenCalled();
  });

  it('should allow access when the token is still valid right now', () => {
    authSessionService.hasValidAccessToken.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/' } as never),
    );

    expect(result).toBeTrue();
    expect(authSessionService.hasValidAccessToken).toHaveBeenCalledOnceWith(0);
  });

  it('should redirect to login with the requested returnUrl when unauthenticated', () => {
    const redirectTree = {} as ReturnType<Router['createUrlTree']>;
    authSessionService.hasValidAccessToken.and.returnValue(false);
    router.createUrlTree.and.returnValue(redirectTree);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/reports' } as never),
    );

    expect(result).toBe(redirectTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/reports' },
    });
  });
});
