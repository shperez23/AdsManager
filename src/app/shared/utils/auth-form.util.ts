import { RegisterRequest } from '../models';

type UnknownRecord = Record<string, unknown>;

interface ErrorWithDetails {
  status?: number;
  message?: string;
  userMessage?: string;
  details?: unknown;
  error?: unknown;
}

const NULLABLE_CONFLICT_DETAIL = 'Nullable object must have a value.';

export interface RegisterFormValue {
  tenantName?: string | null;
  tenantSlug?: string | null;
  name?: string | null;
  email?: string | null;
  password?: string | null;
}

export function buildRegisterPayload(value: RegisterFormValue): RegisterRequest {
  const tenantName = trimToUndefined(value.tenantName);
  const name = trimToUndefined(value.name);
  const providedSlug = trimToUndefined(value.tenantSlug);
  const tenantSlug = providedSlug ?? (tenantName ? slugifyTenantName(tenantName) : undefined);

  return {
    tenantName,
    tenantSlug,
    name,
    fullName: name,
    email: value.email?.trim() ?? '',
    password: value.password ?? '',
  };
}

export function slugifyTenantName(value: string | null | undefined): string {
  const normalized = value
    ?.trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized?.slice(0, 63) ?? '';
}

export function trimToUndefined(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function extractApiErrorMessage(error: unknown, fallbackMessage: string): string {
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

  const entries = Object.values(rawErrors as UnknownRecord);
  for (const entry of entries) {
    if (Array.isArray(entry)) {
      const firstMessage = entry.find((value) => typeof value === 'string' && value.trim());
      if (typeof firstMessage === 'string') {
        return firstMessage;
      }
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
