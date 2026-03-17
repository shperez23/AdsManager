import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
  fullName?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly endpoint = 'auth';

  constructor(private readonly baseApiService: BaseApiService) {}

  register(payload: RegisterRequest): Observable<AuthTokensResponse> {
    return this.baseApiService.post<AuthTokensResponse, RegisterRequest>(`${this.endpoint}/register`, payload);
  }

  login(payload: LoginRequest): Observable<AuthTokensResponse> {
    return this.baseApiService.post<AuthTokensResponse, LoginRequest>(`${this.endpoint}/login`, payload);
  }

  refresh(payload: RefreshTokenRequest): Observable<AuthTokensResponse> {
    return this.baseApiService.post<AuthTokensResponse, RefreshTokenRequest>(`${this.endpoint}/refresh`, payload);
  }

  me(): Observable<AuthUser> {
    return this.baseApiService.get<AuthUser>(`${this.endpoint}/me`);
  }
}
