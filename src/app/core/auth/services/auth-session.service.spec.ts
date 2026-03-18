import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../api/services/auth.service';
import { ToastService } from '../../notifications/toast.service';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  let authApi: jasmine.SpyObj<AuthService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;
  let service: AuthSessionService;

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

    service = new AuthSessionService(authApi, toastService, router);
  });

  it('should keep the session valid when the backend omits expiresIn', () => {
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
