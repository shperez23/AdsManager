import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';

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
    window.sessionStorage.clear();

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
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl'], {
      url: '/reports',
    });
    router.navigate.and.returnValue(Promise.resolve(true));
  });

  it('should not hydrate the session from storage while running on the server', () => {
    window.localStorage.setItem(
      'adsmanager.auth.refresh-token',
      JSON.stringify({ refreshToken: 'refresh-token' }),
    );
    window.sessionStorage.setItem(
      'adsmanager.auth.access-token',
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
    expect(JSON.parse(window.localStorage.getItem('adsmanager.auth.refresh-token') ?? '{}')).toEqual({
      refreshToken: 'refresh-token',
    });
    expect(
      JSON.parse(window.sessionStorage.getItem('adsmanager.auth.access-token') ?? '{}').accessToken,
    ).toBe('opaque-token');
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

  it('should refresh the access token when only the persisted refresh token is available', async () => {
    window.localStorage.setItem(
      'adsmanager.auth.refresh-token',
      JSON.stringify({ refreshToken: 'persisted-refresh-token' }),
    );

    authApi.refresh.and.returnValue(
      of({
        accessToken: 'renewed-access-token',
        refreshToken: 'rotated-refresh-token',
        expiresIn: 300,
      }),
    );
    authApi.me.and.returnValue(
      of({
        id: 'user-1',
        email: 'sergio@example.com',
        fullName: 'Sergio Perez',
      }),
    );

    const service = createService();
    const isAuthenticated = await firstValueFrom(service.ensureAuthenticated());

    expect(isAuthenticated).toBeTrue();
    expect(authApi.refresh).toHaveBeenCalledOnceWith({
      refreshToken: 'persisted-refresh-token',
    });
    expect(service.accessToken).toBe('renewed-access-token');
    expect(JSON.parse(window.localStorage.getItem('adsmanager.auth.refresh-token') ?? '{}')).toEqual({
      refreshToken: 'rotated-refresh-token',
    });
  });

  it('should clear browser storage and redirect to login on logout', async () => {
    const service = createService();

    authApi.login.and.returnValue(
      of({
        accessToken: 'opaque-token',
        refreshToken: 'refresh-token',
        expiresIn: 300,
      }),
    );
    authApi.me.and.returnValue(of({ id: 'user-1', email: 'sergio@example.com' }));

    await firstValueFrom(service.login({ email: 'sergio@example.com', password: 'secret123' }));

    service.logout('manual');

    expect(window.localStorage.getItem('adsmanager.auth.refresh-token')).toBeNull();
    expect(window.sessionStorage.getItem('adsmanager.auth.access-token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      replaceUrl: true,
      queryParams: { returnUrl: '/reports' },
    });
  });
});
