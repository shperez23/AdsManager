import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { BaseApiService } from './base-api.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        BaseApiService,
        AuthService,
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should normalize direct token responses for login', () => {
    let receivedAccessToken: string | undefined;

    service.login({ email: 'sergio@example.com', password: 'secret123' }).subscribe((tokens) => {
      receivedAccessToken = tokens.accessToken;
      expect(tokens.refreshToken).toBe('refresh-token');
      expect(tokens.expiresIn).toBe(300);
    });

    const request = httpMock.expectOne('https://localhost:61570/api/v1/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush({
      accessToken: 'opaque-access-token',
      refreshToken: 'refresh-token',
      expiresIn: 300,
    });

    expect(receivedAccessToken).toBe('opaque-access-token');
  });

  it('should normalize wrapped token responses with token aliases for login', () => {
    let receivedAccessToken: string | undefined;

    service.login({ email: 'sergio@example.com', password: 'secret123' }).subscribe((tokens) => {
      receivedAccessToken = tokens.accessToken;
      expect(tokens.refreshToken).toBe('refresh-token');
      expect(tokens.expiration).toBe('2026-03-18T12:00:00Z');
    });

    const request = httpMock.expectOne('https://localhost:61570/api/v1/auth/login');
    request.flush({
      success: true,
      data: {
        token: 'wrapped-access-token',
        refreshToken: 'refresh-token',
        expiration: '2026-03-18T12:00:00Z',
      },
    });

    expect(receivedAccessToken).toBe('wrapped-access-token');
  });

  it('should fail when the authentication response does not contain usable tokens', () => {
    let receivedError: unknown;

    service.login({ email: 'sergio@example.com', password: 'secret123' }).subscribe({
      next: () => fail('Expected the request to fail when tokens are missing.'),
      error: (error) => {
        receivedError = error;
      },
    });

    const request = httpMock.expectOne('https://localhost:61570/api/v1/auth/login');
    request.flush({ success: true, data: { userId: 'user-1' } });

    expect(receivedError instanceof Error).toBeTrue();
    expect((receivedError as Error).message).toContain('tokens válidos');
  });
});
