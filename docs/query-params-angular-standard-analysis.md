# Estándar único de query params para Angular (análisis)

## 1) Lectura de arquitectura frontend actual

El frontend sigue una arquitectura **modular por feature** con separación clara por capas:
- `features/*` para presentación y flujos de cada dominio (ad-accounts, ads, ad-sets, campaigns, insights).
- `core/api/services/*` para acceso HTTP y contratos de infraestructura.
- `shared/models/*` para contratos transversales de datos.

Se usan componentes standalone y rutas directas a páginas por feature.

## 2) Estado actual de query params (Swagger vs Frontend)

### Swagger
Hay dos convenciones coexistiendo:
1. **PascalCase** en listados y reportes de insights:
   - `Page`, `PageSize`, `Search`, `SortBy`, `SortDirection`, `Status`, `CampaignId`, `AdAccountId`.
2. **camelCase** en dashboard e insights por entidad:
   - `dateFrom`, `dateTo`, `campaignId`, `adAccountId`.

Además, el swagger publica parámetros derivados como `NormalizedPage` y `NormalizedPageSize` en varios endpoints de lectura.

### Frontend
- `shared/models/api.models.ts` define paginación y filtros base en **PascalCase** (`Page`, `PageSize`, etc.).
- `reports.service.ts` mezcla ese contrato con filtros en **camelCase** (`dateFrom`, `dateTo`, `campaignId`, `adAccountId`).
- Componentes de listados (ad-accounts, ad-sets, ads, campaigns) envían sobre todo `Page/PageSize/Search/Status`; sólo ad-accounts usa sort en UI.
- Existe un set alternativo de modelos en `core/api/models` con naming **camelCase** (`page`, `pageSize`, `sortBy`, `sortDirection`) que hoy no es el contrato activo en servicios.

## 3) Inconsistencias detectadas entre módulos

1. **Doble estándar de nombres (PascalCase vs camelCase)** dentro del mismo frontend.
2. **Duplicación de contratos** de query params en `shared/models` y `core/api/models`.
3. **Sort incompleto por módulo**: ad-accounts sí envía `SortBy/SortDirection`; ads y ad-sets no lo exponen aunque backend lo soporta.
4. **Filtros de insights fragmentados**:
   - Insights global (reports) usa combinación de paginación + fechas + IDs.
   - Insights por entidad (`ads/{id}/insights`, `adsets/{id}/insights`, `campaigns/{id}/insights`) usa sólo fechas.
5. **Parámetros “normalized” expuestos en Swagger** pero no deberían formar parte del contrato de cliente (parecen de normalización interna backend).

## 4) Propuesta de estándar único de interfaces TypeScript (sin implementar código)

> Recomendación de estándar para Angular: **camelCase en modelos internos de frontend** y un único mapper de serialización HTTP hacia los nombres reales que exija cada endpoint.

### 4.1 Interfaz unificada de paginación
- `page?: number`
- `pageSize?: number`

### 4.2 Interfaz unificada de ordenamiento
- `sortBy?: string`
- `sortDirection?: 'asc' | 'desc' | 0 | 1` (definir una sola variante final en la decisión de arquitectura)

### 4.3 Interfaz unificada de filtros base
- `search?: string`
- `status?: string`

### 4.4 Interfaz unificada de filtros de insights
- `dateFrom?: string` (ISO date)
- `dateTo?: string` (ISO date)
- `campaignId?: string`
- `adAccountId?: string`

### 4.5 Contratos compuestos sugeridos
- `ListQueryParams = Pagination + Sorting + BaseFilters`
- `CampaignListQueryParams = ListQueryParams + { adAccountId?: string }`
- `AdSetListQueryParams = ListQueryParams + { campaignId?: string }`
- `AdListQueryParams = ListQueryParams + { campaignId?: string; adSetId?: string }`
- `InsightsQueryParams = Pagination + Sorting + BaseFilters + InsightsFilters`
- `EntityInsightsDateRangeParams = { dateFrom?: string; dateTo?: string }`

## 5) Componentes y servicios a refactorizar

### Prioridad alta (contratos y serialización)
1. `src/app/shared/models/api.models.ts`
2. `src/app/core/api/services/base-api.service.ts` (si se centraliza transformación naming)
3. `src/app/core/api/services/reports.service.ts`
4. `src/app/core/api/services/adaccounts.service.ts`
5. `src/app/core/api/services/adsets.service.ts`
6. `src/app/core/api/services/ads.service.ts`
7. `src/app/core/api/services/campaigns.service.ts`

### Prioridad media (consumo en UI)
8. `src/app/features/ad-accounts/components/adaccounts-list/adaccounts-list.component.ts`
9. `src/app/features/ad-sets/components/adsets-list/adsets-list.component.ts`
10. `src/app/features/ads/components/ads-list/ads-list.component.ts`
11. `src/app/features/campaigns/components/campaigns-list/campaigns-list.component.ts`
12. `src/app/features/insights/components/insights-summary/insights-summary.component.ts`

### Prioridad baja (deuda técnica / limpieza)
13. `src/app/core/api/models/pagination-request.model.ts`
14. `src/app/core/api/models/ad-accounts-query-params.model.ts`
15. `src/app/core/api/models/sort-direction.enum.ts`
16. `src/app/core/api/models/index.ts`

## 6) Lista exacta de archivos a modificar (viable)

Sí, es viable definir una lista exacta inicial para la estandarización:

1. `src/app/shared/models/api.models.ts`
2. `src/app/core/api/services/base-api.service.ts`
3. `src/app/core/api/services/reports.service.ts`
4. `src/app/core/api/services/adaccounts.service.ts`
5. `src/app/core/api/services/adsets.service.ts`
6. `src/app/core/api/services/ads.service.ts`
7. `src/app/core/api/services/campaigns.service.ts`
8. `src/app/features/ad-accounts/components/adaccounts-list/adaccounts-list.component.ts`
9. `src/app/features/ad-sets/components/adsets-list/adsets-list.component.ts`
10. `src/app/features/ads/components/ads-list/ads-list.component.ts`
11. `src/app/features/campaigns/components/campaigns-list/campaigns-list.component.ts`
12. `src/app/features/insights/components/insights-summary/insights-summary.component.ts`
13. `src/app/core/api/models/pagination-request.model.ts`
14. `src/app/core/api/models/ad-accounts-query-params.model.ts`
15. `src/app/core/api/models/sort-direction.enum.ts`
16. `src/app/core/api/models/index.ts`

## 7) Decisión arquitectónica sugerida

Para mantener coherencia y bajo acoplamiento:
- Modelo de dominio frontend: **camelCase único**.
- Infraestructura HTTP: capa de mapeo en `BaseApiService` (o helper dedicado) para convertir keys según endpoint/versión backend.
- UI: sólo consume contratos normalizados (`page`, `pageSize`, `search`, `sortBy`, `sortDirection`, etc.).

Con esto se evita contaminar componentes con convenciones mixtas del backend y se reduce deuda técnica en evoluciones futuras.
