# Análisis de cobertura Frontend (Angular) vs Swagger

## Arquitectura frontend observada

- Arquitectura **modular por feature** (`src/app/features/*`) con componentes `standalone` y separación por `pages` + `components`.
- Capa de acceso API centralizada en `src/app/core/api/services/*`.
- Modelos DTO compartidos en `src/app/shared/models`.
- Patrón dominante: **Presentación (componentes) + Servicios API (infraestructura)**, sin estado global complejo.

## Recursos expuestos en Swagger (normalizados)

Swagger incluye recursos para:

- `adaccounts`
- `ads`
- `adsets`
- `campaigns`
- `dashboard`
- `auth`
- `meta/*`
- `reports/*`
- `rules`

## Páginas UI existentes en `src/app/features`

- `dashboard`
- `ad-accounts`
- `ads`
- `ad-sets`

Rutas registradas:

- `/` → dashboard
- `/ad-accounts`
- `/ads`
- `/ad-sets`
- `/insights` (reusa `AdsPageComponent`)

## Resultado de cobertura

### 1) Verificar si existen páginas para cada recurso

| Recurso Swagger | Página/UI en `features` | Estado |
|---|---|---|
| adaccounts | Sí (`ad-accounts`) | ✅ |
| ads | Sí (`ads`) | ✅ |
| adsets | Sí (`ad-sets`) | ✅ |
| campaigns | No | ❌ Falta |
| dashboard | Sí (`dashboard`) | ⚠️ Parcial (sin consumo API dashboard) |
| auth | No | ❌ Falta |
| meta/* | No | ❌ Falta |
| reports/* | No | ❌ Falta |
| rules | No | ❌ Falta |

### 2) CRUD completo por recurso funcional principal

| Recurso | Create | Read listado | Read detalle | Update | Delete | Estado |
|---|---|---|---|---|---|---|
| adaccounts | No (solo import/sync) | Sí | No endpoint dedicado en UI | No | No | ⚠️ Incompleto |
| ads | Sí | Sí | No vista dedicada (solo selección e insights) | Sí | No (Swagger tampoco expone delete) | ⚠️ Parcial |
| adsets | Sí | Sí | No vista dedicada | Sí | No (Swagger tampoco expone delete) | ⚠️ Parcial |
| campaigns | No UI | No UI | No UI | No UI | No UI | ❌ No implementado |

### 3) Acciones específicas

| Acción | adaccounts | ads | adsets | campaigns |
|---|---|---|---|---|
| pause | N/A en Swagger | ✅ UI | ✅ UI | ❌ No UI |
| activate | N/A en Swagger | ✅ UI | ✅ UI | ❌ No UI |
| sync | ✅ UI (adaccounts) | ❌ | ❌ | ❌ |
| insights | ❌ (meta insights no expuesto) | ✅ UI | ❌ UI (aunque servicio existe) | ❌ No UI |

### 4) Paginación

- **Implementada** en listados de `adaccounts`, `ads`, `adsets` (page/pageSize/totalPages y controles prev/next + numeración).
- **No implementada** para recursos sin pantalla (`campaigns`, `rules`, `meta/connections`, etc.).

### 5) Filtros

- `adaccounts`: búsqueda + status + ordenamiento.
- `ads`: búsqueda + status.
- `adsets`: búsqueda + status.

**Faltantes respecto a Swagger**:

- Filtro `CampaignId` (swagger lo soporta en `ads` y `adsets`) no expuesto en UI.
- Ordenamiento `SortBy/SortDirection` para `ads` y `adsets` no expuesto en UI (sí en adaccounts).
- Filtros para `campaigns` (`AdAccountId`, status, búsqueda, orden) no implementados por ausencia de pantalla.

## Funcionalidades UI faltantes

1. Módulo/páginas de `campaigns` (listado, alta, edición, acciones y insights).
2. Módulo de autenticación (`login/register/refresh/me`).
3. Pantallas para `meta connections` (CRUD + validate + refresh token).
4. Flujos `reports` (`/reports/insights`, `/reports/dashboard`).
5. Pantallas para `rules` (listado, crear, editar, activar/desactivar).
6. Integración real de `/dashboard` API (actualmente dashboard es mock estático).

## Pantallas incompletas

1. `dashboard`: sin consumo de endpoint `/api/dashboard`.
2. `ad-accounts`: botón “Ver detalle” sin navegación/estado que renderice `AdaccountDetailComponent`.
3. `ad-accounts detail`: carga solo adaccount por listado y deja `ads`/`adSets` vacíos; no consume endpoints específicos de detalle/relación.
4. `ads`: columna `Spend` sin dato real, muestra “—”.
5. `adsets`: sin acción de insights en UI pese a tener método de servicio.

## Acciones no implementadas (UI)

- `campaigns/{id}/pause`
- `campaigns/{id}/activate`
- `campaigns/{id}/insights`
- `adsets/{id}/insights` (servicio sí, UI no)
- `meta/*` operativas (status patch, creación de campañas/adsets/ads en Meta, insights de ad-account Meta)
- `rules/{id}/activate`
- `rules/{id}/deactivate`

