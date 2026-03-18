import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../api/services/auth.service';
import { ToastService } from '../../notifications/toast.service';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  let authApi: jasmine.SpyObj<AuthService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  function createService(platformId: unknown = 'browser'): AuthSessionService {
    return new AuthSessionService(authApi, toastService, router, platformId as object);
  }

  beforeEach(() => {
    window.localStorage.clear();

    authApi = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'me',
      'register',
      'refresh',
    ]);
    toastService = jasmine.createSpyObj<ToastService>('ToastService', [
      'success',
      'warning',
      'error',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
  });

  it('should not hydrate the session from localStorage while running on the server', () => {
    window.localStorage.setItem(
      'adsmanager.auth.session',
      JSON.stringify({
        accessToken: 'opaque-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 60_000,
      }),
    );

    const service = createService('server');

    expect(service.isBrowser).toBeFalse();
    expect(service.accessToken).toBeNull();
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it('should keep the session valid when the backend omits expiresIn', () => {
    const service = createService();

    authApi.login.and.returnValue(
      of({
        accessToken: 'opaque-token',
        refreshToken: 'refresh-token',
      }),
    );
    authApi.me.and.returnValue(
      of({
        id: 'user-1',
        email: 'sergio@example.com',
        fullName: 'Sergio Perez',
      }),
    );

    let currentUserEmail: string | undefined;

    service.login({ email: 'sergio@example.com', password: 'secret123' }).subscribe((user) => {
      currentUserEmail = user.email;
    });

    expect(currentUserEmail).toBe('sergio@example.com');
    expect(service.accessToken).toBe('opaque-token');
    expect(service.hasValidAccessToken(0)).toBeTrue();
  });

  it('should keep the session and return a fallback user when loading the profile fails after login', () => {
    const service = createService();

    authApi.login.and.returnValue(
      of({
        accessToken: 'opaque-token',
        refreshToken: 'refresh-token',
      }),
    );
    authApi.me.and.returnValue(throwError(() => new Error('Profile endpoint unavailable')));

    let authenticatedUserEmail: string | undefined;

    service.login({ email: 'sergio@example.com', password: 'secret123' }).subscribe((user) => {
      authenticatedUserEmail = user.email;
    });

    expect(authenticatedUserEmail).toBe('sergio@example.com');
    expect(service.accessToken).toBe('opaque-token');
    expect(service.hasValidAccessToken(0)).toBeTrue();
  });
});
