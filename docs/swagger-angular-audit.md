# Auditoría Angular vs Swagger

## Alcance
Comparación entre los servicios de `src/app/core/api/services` y el contrato API en `src/swagger/swagger.json`, usando la base versionada definida por `API_BASE_URL` (`/api/{version}`).

## Lista de servicios incompletos

1. **AdsService**
   - Incompleto respecto al Swagger para el recurso Ads.
   - Faltan métodos para cubrir todos los endpoints (`GET /ads`, `PUT /ads/{id}/pause`, `PUT /ads/{id}/activate`).

2. **AdSetsService**
   - Incompleto respecto al Swagger para el recurso AdSets.
   - Faltan métodos para cubrir todos los endpoints (`GET /adsets`, `PUT /adsets/{id}/pause`, `PUT /adsets/{id}/activate`).

3. **Cobertura global de `core/api/services`**
   - No existen servicios dedicados para recursos definidos en Swagger:
     - `auth`
     - `campaigns`
     - `dashboard`
     - `meta/*`
     - `reports/*`
     - `rules/*`

> `AdAccountsService` sí cubre sus endpoints principales (`GET /adaccounts`, `POST /adaccounts/import-from-meta`, `POST /adaccounts/{id}/sync`).

## Lista de métodos faltantes

### En servicios existentes

#### AdsService
- `getAds(params?)` → `GET /api/v1/ads`
- `pauseAd(id)` → `PUT /api/v1/ads/{id}/pause`
- `activateAd(id)` → `PUT /api/v1/ads/{id}/activate`

#### AdSetsService
- `getAdSets(params?)` → `GET /api/v1/adsets`
- `pauseAdSet(id)` → `PUT /api/v1/adsets/{id}/pause`
- `activateAdSet(id)` → `PUT /api/v1/adsets/{id}/activate`

### Servicios/métodos faltantes completos (según Swagger)
- **AuthService**: register, login, refresh, me.
- **CampaignsService**: list/create/get/update/insights/pause/activate.
- **DashboardService**: dashboard.
- **MetaService(s)**:
  - ad-accounts
  - campaigns status (patch)
  - adsets/ads
  - connections (get/post/put/delete/refresh-token/validate)
  - insights
- **ReportsService**: insights, dashboard.
- **RulesService**: list/create/update/activate/deactivate.

## Validaciones

### Nombres de métodos
- La convención actual es consistente y correcta: `getX`, `createX`, `updateX`, `pauseX`, `activateX`, `getXById`, `getXInsights`.

### Parámetros query
- `dateFrom` y `dateTo` en insights están alineados con Swagger.
- Hallazgo:
  - `PaginationQueryParams` es compartido y contiene `CampaignId` (válido para ads/adsets) pero no para adaccounts.
  - Swagger para listados también expone `NormalizedPage` y `NormalizedPageSize`, ausentes en el tipo Angular.

### Request bodies
- `CreateAdRequest`, `UpdateAdRequest`, `CreateAdSetRequest`, `UpdateAdSetRequest` están alineados con el esquema Swagger en nombres de propiedades.

## Correcciones necesarias

1. Completar `AdsService` y `AdSetsService` con los métodos faltantes.
2. Crear servicios faltantes para `auth`, `campaigns`, `dashboard`, `meta`, `reports`, `rules`.
3. Separar query params por recurso para evitar parámetros sobrantes/faltantes:
   - `AdAccountsQueryParams`
   - `AdsQueryParams`
   - `AdSetsQueryParams`
4. Mantener la convención de nombres existente en nuevos métodos/servicios para consistencia arquitectónica.
