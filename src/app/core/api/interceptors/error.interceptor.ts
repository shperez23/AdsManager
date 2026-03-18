import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiError } from '../../../shared/models';
import { normalizeApiError } from '../utils/api-error.util';

export const errorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = normalizeApiError(error);

      logHttpError(request, apiError, error);

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
