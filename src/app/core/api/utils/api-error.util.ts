import { HttpErrorResponse } from '@angular/common/http';

import { ApiError } from '../../../shared/models';

interface ErrorWithDetails {
  status?: number;
  message?: string;
  userMessage?: string;
  details?: unknown;
  error?: unknown;
  url?: string;
  timestamp?: string;
}

type UnknownRecord = Record<string, unknown>;

const NULLABLE_CONFLICT_DETAIL = 'Nullable object must have a value.';

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof HttpErrorResponse) {
    return {
      status: error.status,
      message: readString(toRecord(error.error), 'message', 'Message') ?? error.message ?? 'Unexpected API error',
      userMessage: resolveUserMessage(error),
      details: error.error,
      url: error.url ?? undefined,
      timestamp: new Date().toISOString(),
    };
  }

  const source = (error ?? {}) as ErrorWithDetails;

  return {
    status: source.status ?? 0,
    message: source.message ?? 'Unexpected API error',
    userMessage: source.userMessage ?? resolveErrorMessage(error, source.message ?? 'Unexpected API error'),
    details: source.details ?? source.error ?? error,
    url: source.url,
    timestamp: source.timestamp ?? new Date().toISOString(),
  };
}

export function resolveErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const source = error as ErrorWithDetails;
  if (typeof source.userMessage === 'string' && source.userMessage.trim()) {
    return source.userMessage;
  }

  const details = toRecord(source.details) ?? toRecord(source.error) ?? toRecord(error);
  const detail = readString(details, 'detail', 'Detail');
  const title = readString(details, 'title', 'Title');
  const message = readString(details, 'message', 'Message') ?? source.message;

  if (source.status === 409 && detail === NULLABLE_CONFLICT_DETAIL) {
    return 'El registro entró en conflicto con datos existentes. Verifica si el tenant o el correo ya fueron registrados.';
  }

  const validationMessage = readValidationMessage(details);
  return validationMessage ?? detail ?? message ?? title ?? fallbackMessage;
}

function resolveUserMessage(error: HttpErrorResponse): string {
  switch (error.status) {
    case 0:
      return 'No fue posible conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
    case 401:
      return 'Tu sesión ha expirado. Inicia sesión nuevamente para continuar.';
    case 403:
      return 'No tienes permisos para realizar esta acción.';
    case 404:
      return 'No pudimos encontrar el recurso solicitado.';
    case 500:
      return 'Ocurrió un error interno. Intenta nuevamente en unos minutos.';
    default:
      return resolveErrorMessage(error.error ?? error, 'No fue posible completar tu solicitud en este momento.');
  }
}

function readValidationMessage(source: UnknownRecord | null): string | null {
  if (!source) {
    return null;
  }

  const rawErrors = source['errors'] ?? source['Errors'];

  if (Array.isArray(rawErrors)) {
    const firstMessage = rawErrors.find((value) => typeof value === 'string' && value.trim());
    return typeof firstMessage === 'string' ? firstMessage : null;
  }

  if (!rawErrors || typeof rawErrors !== 'object') {
    return null;
  }

  for (const entry of Object.values(rawErrors as UnknownRecord)) {
    if (!Array.isArray(entry)) {
      continue;
    }

    const firstMessage = entry.find((value) => typeof value === 'string' && value.trim());
    if (typeof firstMessage === 'string') {
      return firstMessage;
    }
  }

  return null;
}

function toRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function readString(source: UnknownRecord | null, ...keys: string[]): string | undefined {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}
