# Contrato OpenAPI canónico para frontend (Angular)

## 1) Lectura arquitectónica del frontend actual

- Arquitectura **modular por dominio/feature** en `src/app/features/*` (dashboard, ad-accounts, ads, ad-sets, campaigns, insights).
- Capa de infraestructura HTTP centralizada en `src/app/core/api/services/*` mediante `BaseApiService`.
- Convención de versionado ya adoptada por frontend: `API_BASE_URL = {apiUrl}/api/{apiVersion}` y `apiVersion: 'v1'` en environments.
- Conclusión de contrato: el frontend está diseñado para consumir rutas **`/api/v1/*`** como fuente de verdad, no rutas legacy sin versión (`/api/*`).

## 2) Duplicados, versionado y deprecación detectados en `swagger.json`

Patrón global del swagger:

- Casi todos los recursos están duplicados en dos variantes equivalentes:
  - Versionada: `/api/v1/...`
  - Legacy: `/api/...`
- En `reports/dashboard` ambas variantes (`/api/v1/reports/dashboard` y `/api/reports/dashboard`) están marcadas como `deprecated: true`.

### Decisión canónica para dashboard

Entre:

- `/api/v1/dashboard`
- `/api/v1/reports/dashboard`

**Canónico frontend: `/api/v1/dashboard`**.

Motivo:

1. `reports/dashboard` está explícitamente deprecado en swagger.
2. El frontend ya tiene `DashboardService` apuntando a `dashboard` (no a `reports/dashboard`).
3. Mantiene separación semántica: `dashboard` para resumen ejecutivo; `reports/*` para reporting analítico.

## 3) Endpoints equivalentes detectados (mismo recurso, doble ruta)

Los siguientes pares son equivalentes funcionalmente y deben consolidarse al contrato versionado `/api/v1/*`:

- `adaccounts`: `/api/v1/adaccounts` ↔ `/api/adaccounts`
- `ads`: `/api/v1/ads*` ↔ `/api/ads*`
- `adsets`: `/api/v1/adsets*` ↔ `/api/adsets*`
- `auth`: `/api/v1/auth*` ↔ `/api/auth*`
- `campaigns`: `/api/v1/campaigns*` ↔ `/api/campaigns*`
- `dashboard`: `/api/v1/dashboard` ↔ `/api/dashboard`
- `meta`: `/api/v1/meta/*` ↔ `/api/meta/*`
- `reports/insights`: `/api/v1/reports/insights` ↔ `/api/reports/insights`
- `rules`: `/api/v1/rules*` ↔ `/api/rules*`

## 4) Rutas que deben quedar activas en frontend

**Regla de oro**:

- ✅ Activo: sólo rutas `/api/v1/*` no deprecadas.
- ⚠️ Deprecated: rutas marcadas deprecated en swagger (aunque existan en v1).
- ❌ No usar: rutas legacy `/api/*` sin versión.

## 5) Matriz final (fuente de verdad frontend)

| Módulo | Endpoint canónico | Método | Status |
|---|---|---|---|
| dashboard | `/api/v1/dashboard` | GET | activo |
| reports | `/api/v1/reports/dashboard` | GET | deprecated |
| reports | `/api/v1/reports/insights` | GET | activo |
| adaccounts | `/api/v1/adaccounts` | GET | activo |
| adaccounts | `/api/v1/adaccounts/import-from-meta` | POST | activo |
| adaccounts | `/api/v1/adaccounts/{id}/sync` | POST | activo |
| ads | `/api/v1/ads` | GET | activo |
| ads | `/api/v1/ads` | POST | activo |
| ads | `/api/v1/ads/{id}` | GET | activo |
| ads | `/api/v1/ads/{id}` | PUT | activo |
| ads | `/api/v1/ads/{id}/insights` | GET | activo |
| ads | `/api/v1/ads/{id}/pause` | PUT | activo |
| ads | `/api/v1/ads/{id}/activate` | PUT | activo |
| adsets | `/api/v1/adsets` | GET | activo |
| adsets | `/api/v1/adsets` | POST | activo |
| adsets | `/api/v1/adsets/{id}` | GET | activo |
| adsets | `/api/v1/adsets/{id}` | PUT | activo |
| adsets | `/api/v1/adsets/{id}/insights` | GET | activo |
| adsets | `/api/v1/adsets/{id}/pause` | PUT | activo |
| adsets | `/api/v1/adsets/{id}/activate` | PUT | activo |
| campaigns | `/api/v1/campaigns` | GET | activo |
| campaigns | `/api/v1/campaigns` | POST | activo |
| campaigns | `/api/v1/campaigns/{id}` | GET | activo |
| campaigns | `/api/v1/campaigns/{id}` | PUT | activo |
| campaigns | `/api/v1/campaigns/{id}/insights` | GET | activo |
| campaigns | `/api/v1/campaigns/{id}/pause` | PUT | activo |
| campaigns | `/api/v1/campaigns/{id}/activate` | PUT | activo |
| auth | `/api/v1/auth/register` | POST | activo |
| auth | `/api/v1/auth/login` | POST | activo |
| auth | `/api/v1/auth/refresh` | POST | activo |
| auth | `/api/v1/auth/me` | GET | activo |
| meta | `/api/v1/meta/ad-accounts` | GET | activo |
| meta | `/api/v1/meta/ad-accounts/{adAccountId}/campaigns` | GET | activo |
| meta | `/api/v1/meta/ad-accounts/{adAccountId}/campaigns` | POST | activo |
| meta | `/api/v1/meta/campaigns/status` | PATCH | activo |
| meta | `/api/v1/meta/ad-accounts/{adAccountId}/adsets` | POST | activo |
| meta | `/api/v1/meta/ads` | POST | activo |
| meta | `/api/v1/meta/ad-accounts/{adAccountId}/insights` | GET | activo |
| meta-connections | `/api/v1/meta/connections` | GET | activo |
| meta-connections | `/api/v1/meta/connections` | POST | activo |
| meta-connections | `/api/v1/meta/connections/{id}` | PUT | activo |
| meta-connections | `/api/v1/meta/connections/{id}` | DELETE | activo |
| meta-connections | `/api/v1/meta/connections/{id}/refresh-token` | POST | activo |
| meta-connections | `/api/v1/meta/connections/{id}/validate` | POST | activo |
| rules | `/api/v1/rules` | GET | activo |
| rules | `/api/v1/rules` | POST | activo |
| rules | `/api/v1/rules/{id}` | PUT | activo |
| rules | `/api/v1/rules/{id}/activate` | PUT | activo |
| rules | `/api/v1/rules/{id}/deactivate` | PUT | activo |
| global-legacy | `/api/*` (sin `/v1`) | ALL | no usar |

## 6) Política operativa recomendada para frontend

1. Consumir exclusivamente `/api/v1/*`.
2. Retirar dependencias de `ReportsService.getDashboardReport()` al migrar completamente a `DashboardService`.
3. Considerar las rutas `/api/reports/dashboard` y `/api/v1/reports/dashboard` como transición legacy/deprecated.
4. Mantener esta matriz como contrato canónico hasta que backend publique OpenAPI sin duplicados de versión.
