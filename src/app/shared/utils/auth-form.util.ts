import { RegisterRequest } from '../models';
import { resolveErrorMessage } from '../../core/api/utils/api-error.util';

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
  return resolveErrorMessage(error, fallbackMessage);
}
