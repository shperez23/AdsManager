import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiError } from '../../../shared/models';
import { normalizeApiError } from '../utils/api-error.util';

const SESSION_EXPIRED_REDIRECT = '/login';

export const errorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = normalizeApiError(error);

      logHttpError(request, apiError, error);

      if (apiError.status === 401) {
        router.navigateByUrl(SESSION_EXPIRED_REDIRECT);
      }

      return throwError(() => apiError);
    }),
  );
};

function logHttpError(
  request: HttpRequest<unknown>,
  apiError: ApiError,
  originalError: HttpErrorResponse,
): void {
  console.error('[HTTP ERROR]', {
    method: request.method,
    requestUrl: request.urlWithParams,
    status: apiError.status,
    message: apiError.message,
    userMessage: apiError.userMessage,
    timestamp: apiError.timestamp,
    responseBody: originalError.error,
  });
}
