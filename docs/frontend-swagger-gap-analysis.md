# Gap Analysis Frontend Angular vs `src/swagger/swagger.json`

## 1) Lectura arquitectónica del frontend actual

El frontend implementa una **arquitectura modular por features** con componentes standalone, routing centralizado y una capa de acceso a API desacoplada mediante servicios en `core/api/services`.

- **Presentación**: `features/*` (pages + components).
- **Aplicación/infra UI**: `core/api/services/*`, `core/api/interceptors/*`, `core/layout/*`.
- **Contratos compartidos**: `shared/models/*`.

No se observa DDD/CQRS formal; la forma predominante es un **modular monolith frontend + service layer**.

Además, el frontend consume por configuración base `.../api/v1` (no `.../api`), mientras swagger expone ambos prefijos (`/api/v1/*` y `/api/*`) como variantes.

---

## 2) Cobertura por endpoint (agrupado por módulos)

> Criterio:
> - **Implementado**: existe servicio + uso en página/componente/ruta.
> - **Parcial**: existe servicio pero sin integración UI/routing completa.
> - **No implementado**: no existe implementación frontend.

---

## Auth

| Endpoint | Estado | Evidencia Angular | Falta exacta |
|---|---|---|---|
| `POST /auth/register` | **Parcial** | `AuthService.register()` | No hay página/flujo UI de registro, ni ruta expuesta. |
| `POST /auth/login` | **Parcial** | `AuthService.login()` | No hay pantalla de login ni gestión de sesión visible en routing actual. |
| `POST /auth/refresh` | **Parcial** | `AuthService.refresh()` | No hay estrategia visible de refresh automático/token lifecycle. |
| `GET /auth/me` | **Parcial** | `AuthService.me()` | No hay pantalla/perfil ni consumo en shell/header. |

> Nota: el interceptor redirige 401 a `/login`, pero esa ruta no existe en `app.routes.ts`.

---

## Dashboard

| Endpoint | Estado | Evidencia Angular | Falta exacta |
|---|---|---|---|
| `GET /dashboard` | **Implementado** | `DashboardService.getDashboard()` + `DashboardPageComponent.ngOnInit()` | Sin brecha funcional principal. |

---

## Campaigns

| Endpoint | Estado | Evidencia Angular | Falta exacta |
|---|---|---|---|
| `GET /campaigns` | **Implementado** | `CampaignsListComponent.loadCampaigns()` | — |
| `POST /campaigns` | **Implementado** | `CampaignsPageComponent.onSubmit()` (modo create) | — |
| `PUT /campaigns/{id}` | **Implementado** | `CampaignsPageComponent.onSubmit()` (modo edit) | — |
| `PUT /campaigns/{id}/pause` | **Implementado** | `CampaignsListComponent.onToggleStatus()` | — |
| `PUT /campaigns/{id}/activate` | **Implementado** | `CampaignsListComponent.onToggleStatus()` | — |
| `GET /campaigns/{id}` | **Parcial** | `CampaignsService.getCampaignById()` existe | No hay vista/ruta de detalle por ID. |
| `GET /campaigns/{id}/insights` | **Parcial** | `CampaignsService.getCampaignInsights()` existe | No hay dashboard/tabla de insights por campaña en UI. |

---

## AdAccounts

| Endpoint | Estado | Evidencia Angular | Falta exacta |
|---|---|---|---|
| `GET /adaccounts` | **Implementado** | `AdaccountsListComponent.loadAdAccounts()` | — |
| `POST /adaccounts/{id}/sync` | **Implementado** | `AdaccountsListComponent.onSync()` | — |
| `POST /adaccounts/import-from-meta` | **Parcial** | `AdAccountsService.importFromMeta()` existe | No hay botón/flujo UI para invocarlo. |

---

## AdSets

| Endpoint | Estado | Evidencia Angular | Falta exacta |
|---|---|---|---|
| `GET /adsets` | **Implementado** | `AdsetsListComponent.loadAdSets()` | — |
| `POST /adsets` | **Implementado** | `AdSetsPageComponent.onSubmit()` (create) | — |
| `PUT /adsets/{id}` | **Implementado** | `AdSetsPageComponent.onSubmit()` (edit) | — |
| `PUT /adsets/{id}/pause` | **Implementado** | `AdsetsListComponent.onToggleStatus()` | — |
| `PUT /adsets/{id}/activate` | **Implementado** | `AdsetsListComponent.onToggleStatus()` | — |
| `GET /adsets/{id}` | **Parcial** | `AdSetsService.getAdSetById()` existe | No hay detalle por ID en rutas/componentes. |
| `GET /adsets/{id}/insights` | **Parcial** | `AdSetsService.getAdSetInsights()` existe | No hay visualización de insights por ad set. |

---

## Ads

| Endpoint | Estado | Evidencia Angular | Falta exacta |
|---|---|---|---|
| `GET /ads` | **Implementado** | `AdsListComponent.loadAds()` | — |
| `POST /ads` | **Implementado** | `AdsPageComponent.onSubmitForm()` (create) | — |
| `PUT /ads/{id}` | **Implementado** | `AdsPageComponent.onSubmitForm()` (edit) | — |
| `PUT /ads/{id}/pause` | **Implementado** | `AdsListComponent.onToggleStatus()` | — |
| `PUT /ads/{id}/activate` | **Implementado** | `AdsListComponent.onToggleStatus()` | — |
| `GET /ads/{id}/insights` | **Implementado** | `AdInsightsDashboardComponent.loadInsights()` | — |
| `GET /ads/{id}` | **Parcial** | `AdsService.getAdById()` existe | No hay flujo/ruta de detalle explícito por ID. |

---

## Reports

| Endpoint | Estado | Evidencia Angular | Falta exacta |
|---|---|---|---|
| `GET /reports/insights` | **Implementado** | `InsightsSummaryComponent.load()` | — |
| `GET /reports/dashboard` | **Parcial** | `ReportsService.getDashboardReport()` existe | No se consume desde ninguna página/componente. |

---

## Rules

| Endpoint | Estado | Evidencia Angular | Falta exacta |
|---|---|---|---|
| `GET /rules` | **Parcial** | `RulesService.getRules()` existe | No hay módulo visual (ruta/página/lista). |
| `POST /rules` | **Parcial** | `RulesService.createRule()` existe | No hay formulario UI. |
| `PUT /rules/{id}` | **Parcial** | `RulesService.updateRule()` existe | No hay edición UI. |
| `PUT /rules/{id}/activate` | **Parcial** | `RulesService.activateRule()` existe | No hay acciones en UI. |
| `PUT /rules/{id}/deactivate` | **Parcial** | `RulesService.deactivateRule()` existe | No hay acciones en UI. |

---

## MetaConnections

| Endpoint | Estado | Evidencia Angular | Falta exacta |
|---|---|---|---|
| `GET /meta/connections` | **Parcial** | `MetaService.getConnections()` existe | No hay página/ruta de listado de conexiones. |
| `POST /meta/connections` | **Parcial** | `MetaService.createConnection()` existe | No hay formulario de alta. |
| `PUT /meta/connections/{id}` | **Parcial** | `MetaService.updateConnection()` existe | No hay edición visual. |
| `DELETE /meta/connections/{id}` | **Parcial** | `MetaService.deleteConnection()` existe | No hay acción UI para eliminar. |
| `POST /meta/connections/{id}/refresh-token` | **Parcial** | `MetaService.refreshConnectionToken()` existe | No hay acción UI para refrescar token. |
| `POST /meta/connections/{id}/validate` | **Parcial** | `MetaService.validateConnection()` existe | No hay acción UI para validar conexión. |

---

## 3) Endpoints Meta Ads (complementarios)

Aunque no estaban en el listado de módulos pedido, en swagger también existen:

- `GET /meta/ad-accounts`
- `GET/POST /meta/ad-accounts/{adAccountId}/campaigns`
- `PATCH /meta/campaigns/status`
- `POST /meta/ad-accounts/{adAccountId}/adsets`
- `POST /meta/ads`
- `GET /meta/ad-accounts/{adAccountId}/insights`

Estado global: **Parcial** (métodos en `MetaService` pero sin integración UI directa).

---

## 4) Resumen de cobertura

- **Implementado**: Dashboard, CRUD operativo principal de Ads/AdSets/Campaigns (sin detalle por ID en varias entidades), listados principales e insights de Ads y Reports/Insights.
- **Parcial**: Auth, Rules, MetaConnections y endpoints de detalle/insights faltantes de Campaigns/AdSets/Ads, además de `reports/dashboard` e `import-from-meta` de AdAccounts.
- **No implementado**: no se detectan endpoints completamente ausentes a nivel servicio dentro de los módulos evaluados; la principal brecha es de **integración UI/routing/flows**.

---

## 5) Gap analysis final y accionable

### Prioridad Alta (bloqueantes funcionales)
1. **Auth end-to-end**
   - Crear rutas y páginas `login/register`.
   - Integrar estado de sesión + persistencia de tokens.
   - Añadir guardas de ruta y resolver redirección real a `/login`.

2. **Rules como módulo funcional**
   - Crear ruta `/rules`, página y componentes (list/form/actions).
   - Conectar acciones activar/desactivar y edición.

3. **MetaConnections operativo**
   - Crear módulo visual `/meta-connections` con CRUD + `refresh-token` + `validate`.

### Prioridad Media (cerrar parciales de negocio)
4. **Campaigns y AdSets: detalle + insights**
   - Crear vistas de detalle por ID.
   - Agregar visualización de insights (tabla + gráficos + filtros de fecha).

5. **Ads detalle por ID**
   - Aprovechar `getAdById()` en una vista dedicada o drawer de detalle.

6. **AdAccounts import-from-meta**
   - Agregar CTA en listado para ejecutar importación y refrescar estado.

### Prioridad Baja (alineación y consistencia)
7. **Unificar Dashboard vs Reports dashboard**
   - Decidir si `GET /dashboard` y `GET /reports/dashboard` convivirán con usos distintos.
   - Si no, consolidar consumo en una sola fuente para evitar duplicidad.

8. **Documentar estrategia de versionado API**
   - Front usa `/api/v1`; documentar explícitamente alias `/api/*` como compatibilidad backend.

---

## 6) Archivos Angular clave revisados

- Servicios API: `src/app/core/api/services/*.ts`
- Routing: `src/app/app.routes.ts`
- Pages/componentes: `src/app/features/**`
- Config API: `src/app/core/config/api-config.ts`
- Interceptor de errores/401: `src/app/core/api/interceptors/error.interceptor.ts`
- Contrato OpenAPI: `src/swagger/swagger.json`

