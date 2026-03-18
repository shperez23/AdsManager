import {
  buildRegisterPayload,
  extractApiErrorMessage,
  slugifyTenantName,
  trimToUndefined,
} from './auth-form.util';

describe('auth-form.util', () => {
  it('should generate a normalized tenant slug from the tenant name', () => {
    expect(slugifyTenantName(' Ads Manager API ')).toBe('ads-manager-api');
    expect(slugifyTenantName('Señor Pérez Media')).toBe('senor-perez-media');
  });

  it('should trim values and keep the register payload aligned with swagger', () => {
    expect(
      buildRegisterPayload({
        tenantName: ' Ads Manager API ',
        tenantSlug: ' ',
        name: ' Sergio Perez ',
        email: ' sergio@example.com ',
        password: 'secret123',
      }),
    ).toEqual({
      tenantName: 'Ads Manager API',
      tenantSlug: 'ads-manager-api',
      name: 'Sergio Perez',
      email: 'sergio@example.com',
      password: 'secret123',
    });
  });

  it('should expose a friendly message for the nullable conflict response', () => {
    expect(
      extractApiErrorMessage(
        {
          status: 409,
          details: {
            detail: 'Nullable object must have a value.',
          },
        },
        'fallback',
      ),
    ).toContain('tenant o el correo');
  });

  it('should return the first validation message when problem details include errors', () => {
    expect(
      extractApiErrorMessage(
        {
          status: 400,
          details: {
            errors: {
              email: ['El correo es obligatorio.'],
            },
          },
        },
        'fallback',
      ),
    ).toBe('El correo es obligatorio.');
  });

  it('should return undefined for empty trimmed values', () => {
    expect(trimToUndefined('   ')).toBeUndefined();
  });
});
