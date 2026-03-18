# Informe de paridad Swagger vs Frontend Angular

## Resumen ejecutivo

- **Swagger analizado:** `src/swagger/swagger.json`.
- **Operaciones OpenAPI analizadas:** **49**.
- **Arquitectura inferida del frontend:** aplicación Angular **modular y feature-driven**, con capas claras de **core** (infraestructura HTTP, auth, interceptores, configuración), **shared** (modelos, utilidades, UI reusable) y **features** (páginas/componentes por dominio funcional).
- **Conclusión global:** el frontend tiene buena cobertura del dominio principal (**auth, dashboard, ad accounts, campaigns, ad sets, ads, reports y rules**), pero no alcanza todavía la paridad total con Swagger porque varios endpoints del bloque **Meta** y un par de endpoints auxiliares sólo existen a nivel de servicio o fallback técnico, sin UI ni flujo funcional completo.

### Cobertura global

| Estado | Cantidad | Porcentaje |
|---|---:|---:|
| ✅ Implementado | 40 | 81.63% |
| ⚠️ Parcial | 9 | 18.37% |
| ❌ No implementado | 0 | 0.00% |
| 🧹 No usado / innecesario | 0 | 0.00% |

### Lectura rápida

- **Fortaleza principal:** los flujos de negocio visibles en la navegación actual (`/login`, `/register`, `/`, `/ad-accounts`, `/campaigns`, `/ad-sets`, `/ads`, `/insights`, `/reports`, `/meta-connections`, `/rules`) sí están conectados con servicios HTTP reales.
- **Gap principal:** el bloque de endpoints **Meta operativos** (catálogo de ad accounts Meta, campañas Meta, ad sets Meta, ads Meta e insights Meta) está implementado sólo en `MetaService`, pero **no está expuesto en una pantalla Angular ni en rutas activas**.
- **Riesgo técnico principal:** el frontend contiene bastante lógica de **normalización defensiva** de respuestas (`data/result/value`, campos en `PascalCase`, payloads alternativos), lo que sugiere **desalineación real entre la API que responde y el contrato Swagger**.

---

## Alcance y criterio de evaluación

### Qué se revisó

1. **Swagger/OpenAPI**
   - paths
   - métodos HTTP
   - parámetros de path/query/body
   - responses declaradas

2. **Frontend Angular**
   - `src/app/core/api/services`
   - `src/app/features/*`
   - interceptores HTTP
   - routing principal
   - formularios y páginas que disparan requests

### Criterio de estado

- **✅ Implementado**: existe servicio y el endpoint está consumido por un flujo Angular visible o de infraestructura activa.
- **⚠️ Parcial**: existe servicio, pero falta UI, falta uso real, o la cobertura no representa todo el contrato expuesto por Swagger.
- **❌ No implementado**: el endpoint existe en Swagger y no existe equivalente real en el frontend.
- **🧹 No usado / innecesario**: el contrato Swagger existe, pero no aparece conectado al producto actual o parece redundante.

---

## Matriz completa de cobertura

| Endpoint | Método | Módulo frontend relacionado | Estado | Cobertura actual / gap |
|---|---|---|---|---|
| `/api/v1/adaccounts` | GET | ad-accounts, reports | ✅ | Implementado en `AdAccountsService.getAdAccounts()` y usado en listado principal y filtros del módulo reports. |
| `/api/v1/adaccounts/import-from-meta` | POST | ad-accounts | ✅ | Implementado y expuesto con botón **Import from Meta** en la página de cuentas. |
| `/api/v1/adaccounts/{id}/sync` | POST | ad-accounts | ✅ | Implementado y expuesto desde el listado de ad accounts. |
| `/api/v1/ads` | GET | ads, insights | ✅ | Implementado con filtros, búsqueda, orden, paginación y reutilización en paneles de insights. |
| `/api/v1/ads` | POST | ads | ✅ | Implementado en formulario de creación de ads. |
| `/api/v1/ads/{id}` | GET | ads | ⚠️ | El servicio existe (`AdsService.getAdById()`), pero no hay flujo UI que lo use. La edición reutiliza el objeto del listado. |
| `/api/v1/ads/{id}` | PUT | ads | ✅ | Implementado en edición de ads. |
| `/api/v1/ads/{id}/insights` | GET | ads, insights | ✅ | Implementado en dashboard de insights del ad y en panel genérico de insights. |
| `/api/v1/ads/{id}/pause` | PUT | ads | ✅ | Implementado en toggle de estado del listado. |
| `/api/v1/ads/{id}/activate` | PUT | ads | ✅ | Implementado en toggle de estado del listado. |
| `/api/v1/adsets` | GET | ad-sets, insights | ✅ | Implementado con filtros, búsqueda, orden y paginación. |
| `/api/v1/adsets` | POST | ad-sets | ✅ | Implementado en formulario de alta de ad set. |
| `/api/v1/adsets/{id}` | GET | ad-sets | ✅ | Implementado y usado al entrar en modo edición. |
| `/api/v1/adsets/{id}` | PUT | ad-sets | ✅ | Implementado en actualización de ad set. |
| `/api/v1/adsets/{id}/insights` | GET | insights | ✅ | Implementado en panel de insights por entidad. |
| `/api/v1/adsets/{id}/pause` | PUT | ad-sets | ✅ | Implementado en toggle de estado. |
| `/api/v1/adsets/{id}/activate` | PUT | ad-sets | ✅ | Implementado en toggle de estado. |
| `/api/v1/auth/register` | POST | auth | ✅ | Implementado en registro + arranque de sesión. |
| `/api/v1/auth/login` | POST | auth | ✅ | Implementado en login + arranque de sesión. |
| `/api/v1/auth/refresh` | POST | auth, auth interceptor | ✅ | Implementado en refresco automático de sesión. |
| `/api/v1/auth/me` | GET | auth | ✅ | Implementado para hidratar usuario actual tras login/refresh. |
| `/api/v1/campaigns` | GET | campaigns, reports, insights | ✅ | Implementado con listado, filtros de reports y paneles de insights. |
| `/api/v1/campaigns` | POST | campaigns | ✅ | Implementado en formulario de creación. |
| `/api/v1/campaigns/{id}` | GET | campaigns | ✅ | Implementado y usado al editar. |
| `/api/v1/campaigns/{id}` | PUT | campaigns | ✅ | Implementado en actualización. |
| `/api/v1/campaigns/{id}/insights` | GET | insights | ✅ | Implementado en panel de insights por entidad. |
| `/api/v1/campaigns/{id}/pause` | PUT | campaigns | ✅ | Implementado en toggle de estado. |
| `/api/v1/campaigns/{id}/activate` | PUT | campaigns | ✅ | Implementado en toggle de estado. |
| `/api/v1/dashboard` | GET | dashboard | ✅ | Implementado como endpoint principal del home/dashboard. |
| `/api/v1/meta/ad-accounts` | GET | meta | ⚠️ | Implementado sólo en `MetaService.getMetaAdAccounts()`. No existe pantalla/ruta que lo consuma. |
| `/api/v1/meta/ad-accounts/{adAccountId}/campaigns` | GET | meta | ⚠️ | Implementado sólo en servicio. Sin UI para explorar campañas Meta. |
| `/api/v1/meta/ad-accounts/{adAccountId}/campaigns` | POST | meta | ⚠️ | Implementado sólo en servicio. No existe formulario para crear campaign Meta. |
| `/api/v1/meta/campaigns/status` | PATCH | meta | ⚠️ | Implementado sólo en servicio. No existe acción UI para cambiar estado de campaign Meta. |
| `/api/v1/meta/ad-accounts/{adAccountId}/adsets` | POST | meta | ⚠️ | Implementado sólo en servicio. No existe formulario/página para crear ad set Meta. |
| `/api/v1/meta/ads` | POST | meta | ⚠️ | Implementado sólo en servicio. No existe formulario/página para crear ad Meta. |
| `/api/v1/meta/ad-accounts/{adAccountId}/insights` | GET | meta | ⚠️ | Implementado sólo en servicio. No existe dashboard/página que use insights nativos Meta. |
| `/api/v1/meta/connections` | GET | meta-connections | ✅ | Implementado y usado al cargar la página de conexiones Meta. |
| `/api/v1/meta/connections` | POST | meta-connections | ✅ | Implementado en formulario de alta. |
| `/api/v1/meta/connections/{id}` | PUT | meta-connections | ✅ | Implementado en edición. |
| `/api/v1/meta/connections/{id}` | DELETE | meta-connections | ✅ | Implementado con acción de borrado. |
| `/api/v1/meta/connections/{id}/refresh-token` | POST | meta-connections | ✅ | Implementado con acción de refresh token. |
| `/api/v1/meta/connections/{id}/validate` | POST | meta-connections | ✅ | Implementado con acción de validación. |
| `/api/v1/reports/insights` | GET | reports, insights | ✅ | Implementado en página de reports y en resumen de insights. |
| `/api/v1/reports/dashboard` | GET | dashboard, reports | ⚠️ | Existe servicio dedicado y además fallback técnico desde `DashboardService`, pero no hay UI propia ni cobertura funcional explícita de todos sus parámetros. |
| `/api/v1/rules` | GET | rules | ✅ | Implementado con listado, filtro por estado, búsqueda y paginación. |
| `/api/v1/rules` | POST | rules | ✅ | Implementado en formulario de creación. |
| `/api/v1/rules/{id}` | PUT | rules | ✅ | Implementado en edición. |
| `/api/v1/rules/{id}/activate` | PUT | rules | ✅ | Implementado en toggle de activación. |
| `/api/v1/rules/{id}/deactivate` | PUT | rules | ✅ | Implementado en toggle de desactivación. |

---

## Gaps accionables para alcanzar 100% de paridad

### 1) `GET /api/v1/ads/{id}` — cobertura parcial

- **Qué falta exactamente:**
  - La llamada de servicio existe, pero **no está conectada a la UI**.
  - La edición del módulo Ads usa el objeto seleccionado del listado, no una carga explícita de detalle.
- **Impacto:**
  - Si el listado trae un DTO resumido, la pantalla de edición puede trabajar con datos incompletos.
- **Dónde debería implementarse:**
  - `src/app/features/ads/pages/ads-page.component.ts`
  - opcionalmente, `src/app/features/ads/components/ads-form/ads-form.component.ts`
- **Acción recomendada:**
  - Al entrar en modo edición, cargar `getAdById(id)` antes de poblar el formulario.

### 2) Bloque Meta operativo — cobertura parcial sistémica

#### Endpoints afectados

- `GET /api/v1/meta/ad-accounts`
- `GET /api/v1/meta/ad-accounts/{adAccountId}/campaigns`
- `POST /api/v1/meta/ad-accounts/{adAccountId}/campaigns`
- `PATCH /api/v1/meta/campaigns/status`
- `POST /api/v1/meta/ad-accounts/{adAccountId}/adsets`
- `POST /api/v1/meta/ads`
- `GET /api/v1/meta/ad-accounts/{adAccountId}/insights`

#### Qué falta exactamente

- **Servicio existe**, pero falta al menos una de estas piezas en todos los casos:
  - **ruta Angular dedicada**;
  - **página o módulo visual**;
  - **formularios** para mutaciones;
  - **tablas/selectores** para explorar catálogos Meta;
  - **dashboards** para insights Meta.

#### Dónde debería implementarse

- Ruta principal: `src/app/app.routes.ts`
- Página contenedora recomendada: extender `src/app/features/meta-connections/pages/meta-connections-page.component.ts` o crear un feature Meta operativo nuevo bajo `src/app/features/meta-*`.
- Formularios/listados recomendados:
  - `src/app/features/meta-connections/components/*` si se decide reutilizar el feature actual;
  - o nuevos componentes bajo un feature dedicado para campañas/ad sets/ads Meta.

#### Acción recomendada

- Separar conceptualmente:
  1. **Meta Connections** = credenciales/conexiones.
  2. **Meta Operations** = catálogos, creación y gestión de campañas/adsets/ads, insights nativos.
- Añadir una ruta visible para Meta Operations y conectar los métodos ya presentes en `MetaService`.

### 3) `GET /api/v1/reports/dashboard` — cobertura parcial

- **Qué falta exactamente:**
  - Existe fallback técnico desde `DashboardService`, pero **no hay pantalla Angular que lo trate como fuente funcional propia**.
  - El método `ReportsService.getDashboardReport()` sólo expone `dateFrom` y `dateTo`, mientras que Swagger también publica `campaignId` y `adAccountId`.
- **Dónde debería implementarse / ajustarse:**
  - `src/app/core/api/services/reports.service.ts`
  - si se desea exposición visual: `src/app/features/reports/pages/reports-page.component.ts`
- **Acción recomendada:**
  - Completar la firma del servicio con todos los query params del contrato Swagger.
  - Decidir si `reports/dashboard` seguirá siendo solo fallback o si merece UI explícita.

---

## Inconsistencias críticas detectadas

### A. Endpoints de Swagger que no llegan a UX real

Los endpoints del bloque Meta operativo y el detalle puntual de ads están **implementados a nivel de servicio pero no de experiencia de usuario**. Eso significa que la paridad con Swagger es **técnica**, no **funcional**.

### B. Endpoints del frontend que no existen en Swagger

- **No se detectaron endpoints HTTP del frontend fuera de Swagger.**
- Todas las rutas consumidas por `BaseApiService` encajan con paths presentes en `swagger.json`.

### C. Divergencias de contrato en responses

El frontend incluye mucha lógica para tolerar respuestas que no necesariamente respetan el Swagger literal:

- envelopes alternativos como `data`, `result`, `value`, `payload`;
- colecciones en `items`, `data`, `result` o `value`;
- campos en `camelCase` y `PascalCase`;
- normalización especial de tokens en auth (`accessToken`, `token`, `jwt`, `jwtToken`, `bearerToken`).

**Lectura arquitectónica:** esto reduce roturas en runtime, pero también es una señal de que la API real y el Swagger probablemente no están 100% alineados.

### D. Divergencias de nombres de campos

1. **Ad Sets**
   - `CreateAdSetRequest` usa `dailyBudget`.
   - `UpdateAdSetRequest` usa `budget`.
   - El frontend soporta ambos nombres en modelos y formularios.
   - **Conclusión:** no rompe hoy, pero introduce asimetría de contrato.

2. **Responses de recursos paginados / insights / auth**
   - El frontend acepta variantes de casing y envoltorios que Swagger no documenta explícitamente.
   - **Conclusión:** la app compensa inconsistencias reales del backend.

### E. Parámetros no explotados o sospechosos en Swagger

En varios listados Swagger publica `NormalizedPage` y `NormalizedPageSize`, pero **el frontend nunca los envía**.

- No parece un bug del frontend porque esos parámetros no son necesarios para navegar.
- Sí parece una señal de que el contrato Swagger está exponiendo parámetros internos o redundantes.

### F. Uso especial de `/dashboard` vs `/reports/dashboard`

`DashboardService` intenta primero `/dashboard` y, sólo ante ciertos errores 500 concretos, cae a `/reports/dashboard`.

- Eso no contradice Swagger.
- Pero sí revela una **dependencia operacional no evidente en el contrato OpenAPI**.

---

## Endpoints frontend ↔ Swagger: hallazgos de coherencia

### Totalmente alineados

- Auth: `register`, `login`, `refresh`, `me`.
- CRUD/acciones principales de campaigns, ad sets, ads, rules.
- Dashboard principal.
- Meta connections.
- Reports insights.

### Alineados sólo a nivel servicio

- Todo el bloque Meta operativo.
- `GET /ads/{id}`.
- `GET /reports/dashboard`.

### No alineados a nivel contrato estricto

- Responses toleradas por el frontend con múltiples formatos y casing.
- Parámetros Swagger que no forman parte del uso real del producto (`NormalizedPage`, `NormalizedPageSize`).

---

## Priorización

### P0 — crítico de negocio

**No se detectaron endpoints P0 totalmente ausentes** en los flujos core actualmente visibles del producto.

Los módulos principales que ya tienen ruta y UI pública sí están respaldados por servicios HTTP funcionales.

### P1 — implementar o cerrar parcialmente

1. **`GET /api/v1/ads/{id}`**
   - completar el flujo de edición con carga real de detalle.

2. **Bloque Meta operativo completo**
   - exponerlo en UI/routing real.
   - si Meta es una capability de negocio prioritaria, este es el gap más grande del proyecto.

3. **`GET /api/v1/reports/dashboard`**
   - decidir si seguirá como fallback técnico o como endpoint funcional de reports.
   - completar firma de parámetros del servicio.

### P2 — mejoras y limpieza

1. **Reducir normalizaciones defensivas** si Swagger y backend se corrigen.
2. **Limpiar parámetros Swagger redundantes** (`NormalizedPage`, `NormalizedPageSize`) si no son públicos.
3. **Homogeneizar naming** de budgets en ad sets.
4. **Revisar si el bloque Meta operativo merece un feature separado** para no mezclar conexiones con operaciones de negocio.

---

## Oportunidades de mejora

### 1) Endpoints existentes sin UI

- Todo el bloque Meta operativo.
- `GET /api/v1/ads/{id}`.
- `GET /api/v1/reports/dashboard` como endpoint de consumo explícito.

### 2) Endpoints duplicados o solapados conceptualmente

- `/api/v1/dashboard` y `/api/v1/reports/dashboard` cubren un espacio funcional parecido.
- Hoy el frontend ya trata uno como principal y el otro como fallback técnico.
- Conviene decidir si ambos deben seguir vivos o si uno debe consolidarse.

### 3) Endpoints no utilizados que podrían eliminarse del frontend

Si el roadmap no contempla UI Meta operativa en el corto plazo, estos métodos de `MetaService` quedan como **dead surface area** del frontend:

- `getMetaAdAccounts`
- `getMetaCampaigns`
- `createMetaCampaign`
- `updateMetaCampaignStatus`
- `createMetaAdSet`
- `createMetaAd`
- `getMetaAdAccountInsights`

### 4) Endpoints/documentación Swagger que podrían limpiarse

- parámetros `NormalizedPage` y `NormalizedPageSize` en listados/reportes;
- documentación de envelopes/casing si el backend realmente responde con estructuras alternativas;
- aclarar la relación exacta entre `/dashboard` y `/reports/dashboard`.

---

## Respuesta directa a la pregunta “¿qué falta para 100% de paridad?”

Para llegar a **100% de paridad funcional** entre frontend y `swagger.json`, falta:

1. **Conectar `GET /api/v1/ads/{id}` al flujo de edición real de Ads.**
2. **Crear UI/routing para los 7 endpoints Meta operativos que hoy viven sólo en `MetaService`.**
3. **Completar y/o exponer correctamente `GET /api/v1/reports/dashboard` con todos sus parámetros Swagger.**
4. **Opcional pero muy recomendable:** alinear Swagger con la forma real de las responses para reducir la lógica defensiva del frontend.

### Resultado final

- **Paridad técnica de servicios:** alta.
- **Paridad funcional visible en UI:** incompleta.
- **Paridad contractual estricta Swagger ↔ backend ↔ frontend:** todavía imperfecta.

