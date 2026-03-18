import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

import { AuthSessionService } from '../services/auth-session.service';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authSessionService = inject(AuthSessionService);

  const authorizedRequest = withAccessToken(request, authSessionService.accessToken);

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (isAuthEndpoint(request.url) || request.headers.has('x-auth-retried')) {
        return throwError(() => error);
      }

      return authSessionService.refreshAccessToken().pipe(
        switchMap((newAccessToken) => {
          if (!newAccessToken) {
            return throwError(() => error);
          }

          const retriedRequest = withAccessToken(request, newAccessToken).clone({
            headers: request.headers.set('x-auth-retried', 'true'),
          });

          return next(retriedRequest);
        }),
      );
    }),
  );
};

function withAccessToken(request: HttpRequest<unknown>, accessToken: string | null): HttpRequest<unknown> {
  if (!accessToken) {
    return request;
  }

  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}
