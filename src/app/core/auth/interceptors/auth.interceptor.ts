import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

import { AuthSessionService } from '../services/auth-session.service';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];
const AUTH_RETRY_HEADER = 'x-auth-retried';
const SKIP_AUTH_HEADER = 'x-skip-auth';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authSessionService = inject(AuthSessionService);

  if (shouldSkipAuthentication(request)) {
    return next(withoutInternalHeaders(request));
  }

  const shouldRefreshBeforeRequest =
    authSessionService.hasRefreshToken() && !authSessionService.hasValidAccessToken(0);

  if (shouldRefreshBeforeRequest) {
    return authSessionService.refreshAccessToken().pipe(
      switchMap((accessToken) => {
        const resolvedAccessToken = accessToken ?? authSessionService.accessToken;
        if (!resolvedAccessToken) {
          return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }));
        }

        return next(withAccessToken(withoutInternalHeaders(request), resolvedAccessToken)).pipe(
          catchError((error: unknown) =>
            handleUnauthorizedError(error, request, next, authSessionService),
          ),
        );
      }),
    );
  }

  return next(withAccessToken(withoutInternalHeaders(request), authSessionService.accessToken)).pipe(
    catchError((error: unknown) => handleUnauthorizedError(error, request, next, authSessionService)),
  );
};

function handleUnauthorizedError(
  error: unknown,
  originalRequest: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authSessionService: AuthSessionService,
): Observable<HttpEvent<unknown>> {
  if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
    return throwError(() => error);
  }

  if (
    shouldSkipAuthentication(originalRequest) ||
    originalRequest.headers.has(AUTH_RETRY_HEADER) ||
    !authSessionService.hasRefreshToken()
  ) {
    authSessionService.logout('unauthorized');
    return throwError(() => error);
  }

  return authSessionService.refreshAccessToken().pipe(
    switchMap((newAccessToken) => {
      if (!newAccessToken) {
        return throwError(() => error);
      }

      const retriedRequest = withAccessToken(withoutInternalHeaders(originalRequest), newAccessToken).clone({
        setHeaders: {
          [AUTH_RETRY_HEADER]: 'true',
        },
      });

      return next(retriedRequest).pipe(
        catchError((retryError: unknown) => {
          if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
            authSessionService.logout('unauthorized');
          }

          return throwError(() => retryError);
        }),
      );
    }),
  );
}

function withAccessToken(
  request: HttpRequest<unknown>,
  accessToken: string | null,
): HttpRequest<unknown> {
  if (!accessToken) {
    return request;
  }

  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function withoutInternalHeaders(request: HttpRequest<unknown>): HttpRequest<unknown> {
  if (!request.headers.has(SKIP_AUTH_HEADER) && !request.headers.has(AUTH_RETRY_HEADER)) {
    return request;
  }

  let headers = request.headers;

  if (headers.has(SKIP_AUTH_HEADER)) {
    headers = headers.delete(SKIP_AUTH_HEADER);
  }

  if (headers.has(AUTH_RETRY_HEADER)) {
    headers = headers.delete(AUTH_RETRY_HEADER);
  }

  return request.clone({ headers });
}

function shouldSkipAuthentication(request: HttpRequest<unknown>): boolean {
  return request.headers.has(SKIP_AUTH_HEADER) || isAuthEndpoint(request.url);
}

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}
