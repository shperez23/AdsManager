import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  AuthTokensResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from '../../../shared/models';
import { BaseApiService } from './base-api.service';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly endpoint = 'auth';

  constructor(private readonly baseApiService: BaseApiService) {}

  register(payload: RegisterRequest): Observable<AuthTokensResponse> {
    return this.baseApiService
      .post<unknown, RegisterRequest>(`${this.endpoint}/register`, payload)
      .pipe(map((response) => normalizeAuthTokensResponse(response)));
  }

  login(payload: LoginRequest): Observable<AuthTokensResponse> {
    return this.baseApiService
      .post<unknown, LoginRequest>(`${this.endpoint}/login`, payload)
      .pipe(map((response) => normalizeAuthTokensResponse(response)));
  }

  refresh(payload: RefreshTokenRequest): Observable<AuthTokensResponse> {
    return this.baseApiService
      .post<unknown, RefreshTokenRequest>(`${this.endpoint}/refresh`, payload)
      .pipe(map((response) => normalizeAuthTokensResponse(response)));
  }

  me(): Observable<AuthUser> {
    return this.baseApiService.get<AuthUser>(`${this.endpoint}/me`);
  }
}

type AuthTokensEnvelope = Partial<AuthTokensResponse> & {
  token?: string | null;
  jwt?: string | null;
  jwtToken?: string | null;
  bearerToken?: string | null;
};

function normalizeAuthTokensResponse(response: unknown): AuthTokensResponse {
  const candidate = extractTokensCandidate(response);
  const accessToken = readTokenValue(candidate, ['accessToken', 'token', 'jwt', 'jwtToken', 'bearerToken']);
  const refreshToken = readTokenValue(candidate, ['refreshToken']);

  if (!accessToken || !refreshToken) {
    throw new Error('La respuesta de autenticación no contiene tokens válidos.');
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: candidate.expiresIn ?? null,
    expiresAt: candidate.expiresAt ?? null,
    expiration: candidate.expiration ?? null,
  };
}

function extractTokensCandidate(response: unknown): AuthTokensEnvelope {
  if (!isRecord(response)) {
    return {};
  }

  const wrappedCandidate = ['data', 'result', 'value', 'payload', 'response']
    .map((key) => response[key])
    .find((value) => isRecord(value));

  return (wrappedCandidate as AuthTokensEnvelope | undefined) ?? (response as AuthTokensEnvelope);
}

function readTokenValue(
  source: AuthTokensEnvelope,
  keys: Array<keyof AuthTokensEnvelope>,
): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
