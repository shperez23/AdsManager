import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

import {
  AuthTokensResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from '../../../shared/models';
import { AuthService, AuthUser } from '../../api/services/auth.service';
import { ToastService } from '../../notifications/toast.service';

interface AuthSessionState {
  accessToken: string | null;
  refreshToken: string;
  expiresAt: number | null;
}

interface PersistedAuthSession {
  refreshToken: string;
}

type LogoutReason = 'manual' | 'expired' | 'unauthorized';

const AUTH_REFRESH_STORAGE_KEY = 'adsmanager.auth.refresh-token';
const AUTH_ACCESS_STORAGE_KEY = 'adsmanager.auth.access-token';
const EXPIRY_LEEWAY_SECONDS = 30;
const DEFAULT_SESSION_DURATION_MS = 60 * 60 * 1000;
const LOGIN_ROUTE = '/login';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly sessionSubject = new BehaviorSubject<AuthSessionState | null>(null);
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);

  readonly session$ = this.sessionSubject.asObservable();
  readonly user$ = this.userSubject.asObservable();

  private refreshInProgress$: Observable<string | null> | null = null;
  private logoutInProgress = false;

  constructor(
    private readonly authApi: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {
    this.hydrateSessionFromStorage();
  }

  get accessToken(): string | null {
    return this.sessionSubject.value?.accessToken ?? null;
  }

  get refreshToken(): string | null {
    return this.sessionSubject.value?.refreshToken ?? null;
  }

  get isAuthenticated(): boolean {
    return this.hasValidAccessToken() || this.hasRefreshToken();
  }

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(payload: LoginRequest): Observable<AuthUser> {
    return this.authApi.login(payload).pipe(
      tap((tokens) => this.startSession(tokens)),
      map(() => this.hydrateUserAfterAuthentication(payload.email)),
    );
  }

  register(payload: RegisterRequest): Observable<AuthUser> {
    return this.authApi.register(payload).pipe(
      tap((tokens) => this.startSession(tokens)),
      map(() => this.hydrateUserAfterAuthentication(payload.email, payload.name)),
    );
  }

  loadCurrentUser(): Observable<AuthUser | null> {
    if (!this.hasValidAccessToken(0)) {
      return of(null);
    }

    return this.authApi.me().pipe(
      tap((user) => this.userSubject.next(user)),
      catchError(() => {
        this.userSubject.next(null);
        return of(null);
      }),
    );
  }

  ensureAuthenticated(): Observable<boolean> {
    if (!this.isBrowser) {
      return of(true);
    }

    if (this.hasValidAccessToken(0)) {
      return of(true);
    }

    if (!this.hasRefreshToken()) {
      return of(false);
    }

    return this.refreshAccessToken().pipe(map((accessToken) => Boolean(accessToken)));
  }

  refreshAccessToken(): Observable<string | null> {
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      return of(null);
    }

    const payload: RefreshTokenRequest = { refreshToken };

    this.refreshInProgress$ = this.authApi.refresh(payload).pipe(
      tap((tokens) => this.startSession(tokens)),
      switchMap((tokens) =>
        this.loadCurrentUser().pipe(map(() => tokens.accessToken ?? this.accessToken)),
      ),
      catchError(() => {
        this.logout('expired');
        return of(null);
      }),
      finalize(() => {
        this.refreshInProgress$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.refreshInProgress$;
  }

  logout(reason: LogoutReason = 'manual'): void {
    this.clearSession();

    if (reason === 'expired') {
      this.toastService.warning({
        title: 'Sesión expirada',
        message: 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.',
      });
    }

    if (reason === 'unauthorized') {
      this.toastService.error({
        title: 'Acceso no autorizado',
        message: 'Necesitas iniciar sesión para continuar.',
      });
    }

    this.redirectToLogin();
  }

  hasRefreshToken(): boolean {
    return Boolean(this.sessionSubject.value?.refreshToken);
  }

  hasValidAccessToken(bufferSeconds: number = EXPIRY_LEEWAY_SECONDS): boolean {
    const session = this.sessionSubject.value;
    if (!session?.accessToken || !session.expiresAt) {
      return false;
    }

    return session.expiresAt > Date.now() + bufferSeconds * 1000;
  }

  private hydrateUserAfterAuthentication(email?: string, fullName?: string): AuthUser {
    const fallbackUser = this.fallbackUserFromSession(email, fullName);

    this.loadCurrentUser().subscribe();

    return fallbackUser;
  }

  private fallbackUserFromSession(email?: string, fullName?: string): AuthUser {
    const fallbackUser: AuthUser = {
      id: 'current',
      email: email ?? 'usuario@local',
      fullName,
    };

    this.userSubject.next(fallbackUser);
    return fallbackUser;
  }

  private startSession(tokens: AuthTokensResponse): void {
    const nextSession: AuthSessionState = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: this.resolveExpiryDate(tokens),
    };

    this.sessionSubject.next(nextSession);
    this.persistSession(nextSession);
  }

  private clearSession(): void {
    this.sessionSubject.next(null);
    this.userSubject.next(null);
    this.removeStorageItem(AUTH_REFRESH_STORAGE_KEY, 'local');
    this.removeStorageItem(AUTH_ACCESS_STORAGE_KEY, 'session');
  }

  private hydrateSessionFromStorage(): void {
    const refreshToken = this.readPersistedRefreshToken();
    const accessState = this.readPersistedAccessState();

    if (!refreshToken && !accessState) {
      return;
    }

    const hydratedSession: AuthSessionState = {
      accessToken: accessState?.accessToken ?? null,
      refreshToken: refreshToken ?? accessState?.refreshToken ?? '',
      expiresAt: accessState?.expiresAt ?? null,
    };

    if (!hydratedSession.refreshToken) {
      this.clearSession();
      return;
    }

    this.sessionSubject.next(hydratedSession);

    if (this.hasValidAccessToken(0)) {
      this.loadCurrentUser().subscribe();
      return;
    }

    this.clearAccessToken();
  }

  private persistSession(session: AuthSessionState): void {
    this.setStorageItem(
      AUTH_REFRESH_STORAGE_KEY,
      JSON.stringify({ refreshToken: session.refreshToken } satisfies PersistedAuthSession),
      'local',
    );

    this.setStorageItem(
      AUTH_ACCESS_STORAGE_KEY,
      JSON.stringify({
        accessToken: session.accessToken,
        expiresAt: session.expiresAt,
        refreshToken: session.refreshToken,
      }),
      'session',
    );
  }

  private readPersistedRefreshToken(): string | null {
    const stored = this.getStorageItem(AUTH_REFRESH_STORAGE_KEY, 'local');
    if (!stored) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<PersistedAuthSession>;
      return parsed.refreshToken?.trim() || null;
    } catch {
      this.removeStorageItem(AUTH_REFRESH_STORAGE_KEY, 'local');
      return null;
    }
  }

  private readPersistedAccessState(): AuthSessionState | null {
    const stored = this.getStorageItem(AUTH_ACCESS_STORAGE_KEY, 'session');
    if (!stored) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<AuthSessionState>;
      if (!parsed.refreshToken || !parsed.expiresAt || !parsed.accessToken) {
        this.removeStorageItem(AUTH_ACCESS_STORAGE_KEY, 'session');
        return null;
      }

      if (parsed.expiresAt <= Date.now()) {
        this.removeStorageItem(AUTH_ACCESS_STORAGE_KEY, 'session');
        return null;
      }

      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        expiresAt: parsed.expiresAt,
      };
    } catch {
      this.removeStorageItem(AUTH_ACCESS_STORAGE_KEY, 'session');
      return null;
    }
  }

  private clearAccessToken(): void {
    const session = this.sessionSubject.value;
    if (!session) {
      return;
    }

    this.sessionSubject.next({
      ...session,
      accessToken: null,
      expiresAt: null,
    });
    this.removeStorageItem(AUTH_ACCESS_STORAGE_KEY, 'session');
  }

  private redirectToLogin(): void {
    if (!this.isBrowser || this.logoutInProgress) {
      return;
    }

    this.logoutInProgress = true;

    const currentUrl = this.router.url || '';
    const shouldIncludeReturnUrl = currentUrl.length > 0 && !currentUrl.startsWith(LOGIN_ROUTE);

    void this.router
      .navigate([LOGIN_ROUTE], {
        replaceUrl: true,
        queryParams: shouldIncludeReturnUrl ? { returnUrl: currentUrl } : undefined,
      })
      .finally(() => {
        this.logoutInProgress = false;
      });
  }

  private getStorageItem(
    key: string,
    storageType: 'local' | 'session',
  ): string | null {
    if (!this.isBrowser) {
      return null;
    }

    const storage = storageType === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
    return storage.getItem(key);
  }

  private setStorageItem(
    key: string,
    value: string,
    storageType: 'local' | 'session',
  ): void {
    if (!this.isBrowser) {
      return;
    }

    const storage = storageType === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
    storage.setItem(key, value);
  }

  private removeStorageItem(key: string, storageType: 'local' | 'session'): void {
    if (!this.isBrowser) {
      return;
    }

    const storage = storageType === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
    storage.removeItem(key);
  }

  private resolveExpiryDate(tokens: AuthTokensResponse): number {
    const jwtExpiry = this.extractJwtExpiry(tokens.accessToken);
    if (jwtExpiry) {
      return jwtExpiry;
    }

    const explicitExpiry =
      this.extractTimestamp(tokens.expiresAt) ?? this.extractTimestamp(tokens.expiration);
    if (explicitExpiry) {
      return explicitExpiry;
    }

    const expiresInSeconds = Number(tokens.expiresIn ?? 0);
    if (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
      return Date.now() + expiresInSeconds * 1000;
    }

    return Date.now() + DEFAULT_SESSION_DURATION_MS;
  }

  private extractTimestamp(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return value > 1_000_000_000_000 ? value : value * 1000;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }

    const numericValue = Number(trimmedValue);
    if (Number.isFinite(numericValue) && numericValue > 0) {
      return numericValue > 1_000_000_000_000 ? numericValue : numericValue * 1000;
    }

    const parsedDate = Date.parse(trimmedValue);
    return Number.isNaN(parsedDate) ? null : parsedDate;
  }

  private extractJwtExpiry(accessToken: string): number | null {
    try {
      const payload = accessToken.split('.')[1];
      if (!payload || !this.isBrowser) {
        return null;
      }

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(globalThis.atob(normalizedPayload)) as { exp?: number };

      if (!decodedPayload.exp) {
        return null;
      }

      return decodedPayload.exp * 1000;
    } catch {
      return null;
    }
  }
}
