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

interface FriendlyHttpError {
  status: number;
  message: string;
  userMessage: string;
  url?: string;
  timestamp: string;
}

const SESSION_EXPIRED_REDIRECT = '/login';

export const errorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const friendlyError = buildFriendlyHttpError(error);

      logHttpError(request, friendlyError, error);

      if (friendlyError.status === 401) {
        router.navigateByUrl(SESSION_EXPIRED_REDIRECT);
      }

      return throwError(() => friendlyError);
    }),
  );
};

function buildFriendlyHttpError(error: HttpErrorResponse): FriendlyHttpError {
  switch (error.status) {
    case 401:
      return {
        status: 401,
        message: 'Unauthorized request',
        userMessage: 'Tu sesión ha expirado. Inicia sesión nuevamente para continuar.',
        url: error.url ?? undefined,
        timestamp: new Date().toISOString(),
      };

    case 403:
      return {
        status: 403,
        message: 'Forbidden request',
        userMessage: 'No tienes permisos para realizar esta acción.',
        url: error.url ?? undefined,
        timestamp: new Date().toISOString(),
      };

    case 404:
      return {
        status: 404,
        message: 'Resource not found',
        userMessage: 'No pudimos encontrar el recurso solicitado.',
        url: error.url ?? undefined,
        timestamp: new Date().toISOString(),
      };

    case 500:
      return {
        status: 500,
        message: 'Internal server error',
        userMessage: 'Ocurrió un error interno. Intenta nuevamente en unos minutos.',
        url: error.url ?? undefined,
        timestamp: new Date().toISOString(),
      };

    default:
      return {
        status: error.status,
        message: error.message || 'Unexpected HTTP error',
        userMessage: 'No fue posible completar tu solicitud en este momento.',
        url: error.url ?? undefined,
        timestamp: new Date().toISOString(),
      };
  }
}

function logHttpError(
  request: HttpRequest<unknown>,
  friendlyError: FriendlyHttpError,
  originalError: HttpErrorResponse,
): void {
  console.error('[HTTP ERROR]', {
    method: request.method,
    requestUrl: request.urlWithParams,
    status: friendlyError.status,
    message: friendlyError.message,
    userMessage: friendlyError.userMessage,
    timestamp: friendlyError.timestamp,
    responseBody: originalError.error,
  });
}
