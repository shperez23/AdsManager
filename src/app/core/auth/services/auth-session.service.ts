import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';

import {
  AuthTokensResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from '../../../shared/models';
import { AuthService, AuthUser } from '../../api/services/auth.service';
import { ToastService } from '../../notifications/toast.service';

interface AuthSessionState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const AUTH_STORAGE_KEY = 'adsmanager.auth.session';
const EXPIRY_LEEWAY_SECONDS = 30;

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly sessionSubject = new BehaviorSubject<AuthSessionState | null>(null);
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);

  readonly session$ = this.sessionSubject.asObservable();
  readonly user$ = this.userSubject.asObservable();

  private refreshInProgress$: Observable<string | null> | null = null;

  constructor(
    private readonly authApi: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
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
    return this.hasValidAccessToken();
  }

  login(payload: LoginRequest): Observable<AuthUser> {
    return this.authApi.login(payload).pipe(
      tap((tokens) => this.startSession(tokens)),
      switchMap(() => this.loadCurrentUser()),
      map((user) => user ?? this.fallbackUserFromSession(payload.email)),
    );
  }

  register(payload: RegisterRequest): Observable<AuthUser> {
    return this.authApi.register(payload).pipe(
      tap((tokens) => this.startSession(tokens)),
      switchMap(() => this.loadCurrentUser()),
      map((user) => user ?? this.fallbackUserFromSession(payload.email, payload.name ?? payload.fullName)),
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

  refreshAccessToken(): Observable<string | null> {
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    if (!this.refreshToken) {
      return of(null);
    }

    const payload: RefreshTokenRequest = { refreshToken: this.refreshToken };

    this.refreshInProgress$ = this.authApi.refresh(payload).pipe(
      tap((tokens) => this.startSession(tokens)),
      map((tokens) => tokens.accessToken),
      catchError(() => {
        this.logout('expired');
        return of(null);
      }),
      finalize(() => {
        this.refreshInProgress$ = null;
      }),
    );

    return this.refreshInProgress$;
  }

  logout(reason: 'manual' | 'expired' | 'unauthorized' = 'manual'): void {
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

    this.router.navigate(['/login']);
  }

  hasValidAccessToken(bufferSeconds: number = EXPIRY_LEEWAY_SECONDS): boolean {
    const session = this.sessionSubject.value;
    if (!session?.accessToken) {
      return false;
    }

    const now = Date.now();
    return session.expiresAt > now + bufferSeconds * 1000;
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
    const expiresAt = this.resolveExpiryDate(tokens);

    const nextSession: AuthSessionState = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
    };

    this.sessionSubject.next(nextSession);
    this.setStorageItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
  }

  private clearSession(): void {
    this.sessionSubject.next(null);
    this.userSubject.next(null);
    this.removeStorageItem(AUTH_STORAGE_KEY);
  }

  private hydrateSessionFromStorage(): void {
    const stored = this.getStorageItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<AuthSessionState>;
      if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt) {
        this.clearSession();
        return;
      }

      const isSessionExpired = parsed.expiresAt <= Date.now();
      if (isSessionExpired) {
        this.clearSession();
        return;
      }

      this.sessionSubject.next({
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        expiresAt: parsed.expiresAt,
      });

      this.loadCurrentUser().subscribe();
    } catch {
      this.clearSession();
    }
  }

  private getStorageItem(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  private setStorageItem(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(key, value);
  }

  private removeStorageItem(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(key);
  }

  private resolveExpiryDate(tokens: AuthTokensResponse): number {
    const jwtExpiry = this.extractJwtExpiry(tokens.accessToken);
    if (jwtExpiry) {
      return jwtExpiry;
    }

    const expiresInMs = Math.max(0, Number(tokens.expiresIn || 0)) * 1000;
    return Date.now() + expiresInMs;
  }

  private extractJwtExpiry(accessToken: string): number | null {
    try {
      const payload = accessToken.split('.')[1];
      if (!payload) {
        return null;
      }

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(atob(normalizedPayload)) as { exp?: number };

      if (!decodedPayload.exp) {
        return null;
      }

      return decodedPayload.exp * 1000;
    } catch {
      return null;
    }
  }
}
