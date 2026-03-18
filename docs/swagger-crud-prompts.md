# Prompts para alinear los CRUD con `src/swagger/swagger.json`

## Resumen arquitectónico detectado

- Proyecto **Angular 20** con **standalone components** y organización **feature-first/modular**.
- La estructura está separada por responsabilidades:
  - `src/app/core/**`: configuración, capa API, interceptores, auth, errores y layout.
  - `src/app/shared/**`: contratos compartidos, utilidades y UI reutilizable.
  - `src/app/features/**`: páginas, formularios y listas por módulo funcional.
- La integración HTTP sigue un patrón consistente:
  - `BaseApiService` encapsula `HttpClient`.
  - Los servicios por recurso viven en `src/app/core/api/services`.
  - Los contratos consumidos por la UI viven en `src/app/shared/models/api.models.ts`.
  - Los componentes de página coordinan formulario + listado + toasts + request feedback.
- La URL base se arma como `${apiUrl}/api/${apiVersion}`, por lo que los servicios deben seguir apuntando a endpoints relativos como `campaigns`, `ads`, `adsets`, `rules`, `meta/connections`, etc.
- Los filtros del backend siguen convención **PascalCase** en query params (`Page`, `PageSize`, `Search`, `Status`, `CampaignId`, `AdAccountId`, etc.).

## Desajustes importantes detectados contra Swagger

1. **Campaigns**
   - `CreateCampaignRequest` del frontend incluye `startDate` y `endDate`, pero Swagger define `lifetimeBudget` y no expone `startDate/endDate` para creación.
   - El modelo `Campaign` del frontend no contempla `lifetimeBudget`, aunque Swagger sí lo contempla en create/update.

2. **Ad Sets**
   - `CreateAdSetRequest` y `UpdateAdSetRequest` están bastante alineados con Swagger.
   - En update, Swagger usa `budget`; el formulario actual reutiliza `dailyBudget` en UI y luego envía `budget`, lo cual debe preservarse con claridad para no romper la UX.

3. **Ads**
   - El CRUD principal está alineado con Swagger en create/update.
   - Conviene validar que filtros, nombres de campos opcionales y modo edición sigan exactamente los contratos de Swagger.

4. **Ad Accounts**
   - Swagger no expone CRUD completo: solo `GET /adaccounts`, `POST /adaccounts/import-from-meta` y `POST /adaccounts/{id}/sync`.
   - No debe intentarse crear/update/delete manual de ad accounts si el objetivo es respetar Swagger.

5. **Rules**
   - El recurso no tiene `GET /rules/{id}` ni `DELETE`; solo listado, creación, actualización y activación/desactivación.
   - Cualquier UX o servicio debe respetar ese alcance y no inventar operaciones inexistentes.

6. **Meta Connections**
   - Sí tiene CRUD utilizable: `GET`, `POST`, `PUT`, `DELETE`, más acciones `refresh-token` y `validate`.
   - Debe mantenerse separado del resto porque usa acciones adicionales fuera del CRUD puro.

---

## Prompt 1 — Auditoría completa de contratos Swagger vs frontend

```text
Analiza el proyecto Angular actual y corrige los CRUD para que queden 100% alineados con `src/swagger/swagger.json`, sin romper la arquitectura existente.

Contexto obligatorio del proyecto:
- Arquitectura detectada: Angular standalone + organización modular por features.
- Capas relevantes:
  - `src/app/core/api/services/**` para acceso HTTP.
  - `src/app/shared/models/api.models.ts` para contratos compartidos.
  - `src/app/core/api/mappers/**` para normalización/mapeo.
  - `src/app/features/**` para páginas, listas y formularios.
- Reutiliza patrones ya existentes: `BaseApiService`, `RequestFeedbackService`, `ToastService`, `takeUntilDestroyed`, `finalize`, formularios reactivos y componentes standalone.
- Mantén nombres, estilo, estructura y flujo ya usados en el proyecto.

Tareas:
1. Revisa `src/swagger/swagger.json` y toma como fuente de verdad los endpoints `v1`.
2. Audita los módulos: `adaccounts`, `campaigns`, `adsets`, `ads`, `rules` y `meta/connections`.
3. Detecta discrepancias entre Swagger y:
   - modelos en `src/app/shared/models/api.models.ts`
   - servicios en `src/app/core/api/services/**`
   - formularios/listas/páginas en `src/app/features/**`
4. Corrige cualquier discrepancia en:
   - nombres de propiedades
   - tipos
   - query params
   - payloads create/update
   - operaciones inexistentes o faltantes
   - mensajes/UX cuando dependan del alcance real del endpoint
5. No inventes endpoints que Swagger no expone.
6. Si un recurso no tiene CRUD completo en Swagger, adapta la UI para reflejar el alcance real.
7. Conserva el patrón actual de componentes de página que coordinan formulario + lista + acciones.
8. Si cambias contratos, actualiza todos los usos afectados y evita duplicar tipos.
9. Prioriza `src/app/shared/models/api.models.ts` como contrato central para la UI.
10. Entrega cambios listos para compilar.

Puntos concretos a validar:
- `Campaigns`: Swagger define `CreateCampaignRequest` con `adAccountId`, `name`, `objective`, `status`, `dailyBudget`, `lifetimeBudget`; y `UpdateCampaignRequest` con `name`, `objective`, `status`, `dailyBudget`, `lifetimeBudget`, `startDate`, `endDate`.
- `AdSets`: Swagger usa `budget` en update y `dailyBudget` en create.
- `Ads`: validar `adSetId`, `name`, `status`, `creativeJson`, `previewUrl`.
- `AdAccounts`: solo listado + `import-from-meta` + `sync`.
- `Rules`: listado + create + update + activate/deactivate.
- `Meta Connections`: get/create/update/delete + `refresh-token` + `validate`.

Devuélveme el código final aplicado directamente en el proyecto.
```

## Prompt 2 — Corregir CRUD de Campaigns según Swagger

```text
Corrige únicamente el módulo de Campaigns para que quede alineado con `src/swagger/swagger.json`, manteniendo la arquitectura y convenciones actuales del proyecto Angular.

Archivos a revisar sí o sí:
- `src/app/shared/models/api.models.ts`
- `src/app/core/api/services/campaigns.service.ts`
- `src/app/core/api/mappers/query-params.mapper.ts`
- `src/app/core/api/mappers/resource-view-model.mapper.ts`
- `src/app/features/campaigns/pages/campaigns-page.component.ts`
- `src/app/features/campaigns/components/campaigns-form/*`
- `src/app/features/campaigns/components/campaigns-list/*`

Fuente de verdad Swagger:
- `GET /api/v1/campaigns`
- `POST /api/v1/campaigns`
- `GET /api/v1/campaigns/{id}`
- `PUT /api/v1/campaigns/{id}`
- `GET /api/v1/campaigns/{id}/insights`
- `PUT /api/v1/campaigns/{id}/pause`
- `PUT /api/v1/campaigns/{id}/activate`

Contrato esperado:
- Query params de listado: `Status`, `AdAccountId`, `Page`, `PageSize`, `Search`, `SortBy`, `SortDirection`.
- `CreateCampaignRequest`: `adAccountId`, `name`, `objective`, `status`, `dailyBudget`, `lifetimeBudget`.
- `UpdateCampaignRequest`: `name`, `objective`, `status`, `dailyBudget`, `lifetimeBudget`, `startDate`, `endDate`.

Objetivo:
1. Ajusta interfaces y tipos para reflejar exactamente ese contrato.
2. Corrige el formulario para create/edit:
   - En create debe enviar solo campos válidos según Swagger.
   - En edit debe enviar solo el payload de update.
3. Si la UI actual no contempla `objective`, `dailyBudget` o `lifetimeBudget`, agrégalos respetando el estilo visual y patrón del proyecto.
4. No agregues endpoints nuevos.
5. Mantén `pause`, `activate` e `insights` funcionando con el servicio actual.
6. Asegúrate de que los mensajes de error/éxito sigan el estilo actual.
7. Deja el módulo listo para compilar.

Quiero que modifiques el código directamente y mantengas consistencia con el resto del proyecto.
```

## Prompt 3 — Corregir CRUD de Ad Sets según Swagger

```text
Corrige únicamente el módulo de Ad Sets para alinearlo con `src/swagger/swagger.json`, respetando la arquitectura actual del proyecto Angular y reutilizando los patrones ya existentes.

Archivos a revisar:
- `src/app/shared/models/api.models.ts`
- `src/app/core/api/services/adsets.service.ts`
- `src/app/core/api/mappers/query-params.mapper.ts`
- `src/app/features/ad-sets/pages/ad-sets-page.component.ts`
- `src/app/features/ad-sets/components/adsets-list/*`

Fuente de verdad Swagger:
- `GET /api/v1/adsets`
- `POST /api/v1/adsets`
- `GET /api/v1/adsets/{id}`
- `PUT /api/v1/adsets/{id}`
- `GET /api/v1/adsets/{id}/insights`
- `PUT /api/v1/adsets/{id}/pause`
- `PUT /api/v1/adsets/{id}/activate`

Contrato esperado:
- Query params: `Status`, `CampaignId`, `Page`, `PageSize`, `Search`, `SortBy`, `SortDirection`.
- `CreateAdSetRequest`: `campaignId`, `name`, `status`, `dailyBudget`, `billingEvent`, `optimizationGoal`, `targetingJson`, `bidStrategy`.
- `UpdateAdSetRequest`: `name`, `status`, `budget`, `billingEvent`, `optimizationGoal`, `targetingJson`, `bidStrategy`, `startDate`, `endDate`.

Instrucciones:
1. Verifica que modelos, servicio y UI usen exactamente esos nombres.
2. Conserva la UX actual donde el usuario edita `dailyBudget`, pero asegúrate de mapear correctamente a `budget` al hacer update si corresponde.
3. Si faltan campos del contrato en el formulario, agrégalos manteniendo el patrón existente.
4. No inventes delete ni otras operaciones no documentadas en Swagger.
5. Mantén filtros, paginación, búsqueda y cambio de estado compatibles con el backend.
6. Revisa también los mensajes y nombres usados en la UI para que sean coherentes con el recurso.
7. Devuélveme el código aplicado directamente.
```

## Prompt 4 — Corregir CRUD de Ads según Swagger

```text
Corrige únicamente el módulo de Ads para que respete `src/swagger/swagger.json` y mantenga coherencia total con la arquitectura actual del proyecto Angular.

Archivos objetivo:
- `src/app/shared/models/api.models.ts`
- `src/app/core/api/services/ads.service.ts`
- `src/app/core/api/mappers/query-params.mapper.ts`
- `src/app/features/ads/pages/ads-page.component.ts`
- `src/app/features/ads/components/ads-form/*`
- `src/app/features/ads/components/ads-list/*`
- `src/app/features/ads/components/ad-insights-dashboard/*` si algún contrato depende de ello

Fuente de verdad Swagger:
- `GET /api/v1/ads`
- `POST /api/v1/ads`
- `GET /api/v1/ads/{id}`
- `PUT /api/v1/ads/{id}`
- `GET /api/v1/ads/{id}/insights`
- `PUT /api/v1/ads/{id}/pause`
- `PUT /api/v1/ads/{id}/activate`

Contrato esperado:
- Query params: `Status`, `CampaignId`, `Page`, `PageSize`, `Search`, `SortBy`, `SortDirection`.
- `CreateAdRequest`: `adSetId`, `name`, `status`, `creativeJson`, `previewUrl`.
- `UpdateAdRequest`: `name`, `status`, `creativeJson`, `previewUrl`.

Qué debes hacer:
1. Audita si el frontend usa propiedades que Swagger no define o deja de usar propiedades requeridas.
2. Ajusta modelos y payloads para create/update exactamente a Swagger.
3. Mantén la edición sin reenviar `adSetId` en update.
4. Verifica filtros, búsqueda y paginación del listado.
5. Mantén la integración con insights y cambio de estado.
6. Conserva los patrones del proyecto: standalone components, formularios reactivos, `takeUntilDestroyed`, `RequestFeedbackService`, `ToastService`.
7. Entrega el código final ya corregido en el proyecto.
```

## Prompt 5 — Ajustar módulo de Ad Accounts al alcance real de Swagger

```text
Ajusta únicamente el módulo de Ad Accounts para que refleje exactamente lo que expone `src/swagger/swagger.json`, sin inventar operaciones no existentes.

Archivos a revisar:
- `src/app/shared/models/api.models.ts`
- `src/app/core/api/services/adaccounts.service.ts`
- `src/app/core/api/mappers/query-params.mapper.ts`
- `src/app/features/ad-accounts/pages/*`
- `src/app/features/ad-accounts/components/*`

Swagger define solo estas operaciones:
- `GET /api/v1/adaccounts`
- `POST /api/v1/adaccounts/import-from-meta`
- `POST /api/v1/adaccounts/{id}/sync`

Query params permitidos en listado:
- `Status`, `Page`, `PageSize`, `Search`, `SortBy`, `SortDirection`

Instrucciones:
1. Verifica que el servicio solo exponga las operaciones realmente documentadas.
2. Si el frontend asume create/update/delete manual de ad accounts, elimínalo o adáptalo.
3. Revisa si `AdAccountsQueryParams` contiene campos no documentados por Swagger, por ejemplo `BusinessId`; si no se usan realmente o rompen consistencia, ajusta el contrato.
4. Mantén las acciones especiales `import-from-meta` y `sync` como parte central del módulo.
5. Ajusta la UI para que el comportamiento del recurso sea consistente con este alcance real.
6. Reutiliza los patrones ya existentes de listas, feedback y toasts.
7. Devuélveme el código final aplicado.
```

## Prompt 6 — Corregir módulo de Rules según Swagger

```text
Corrige únicamente el módulo de Rules para que quede alineado con `src/swagger/swagger.json`, manteniendo la estructura y estilo actuales del proyecto Angular.

Archivos a revisar:
- `src/app/shared/models/api.models.ts`
- `src/app/core/api/services/rules.service.ts`
- `src/app/core/api/mappers/query-params.mapper.ts`
- `src/app/features/rules/pages/*`
- `src/app/features/rules/components/*`

Swagger define estas operaciones:
- `GET /api/v1/rules`
- `POST /api/v1/rules`
- `PUT /api/v1/rules/{id}`
- `PUT /api/v1/rules/{id}/activate`
- `PUT /api/v1/rules/{id}/deactivate`

Contrato esperado:
- Query params: `Status` (boolean), `Page`, `PageSize`, `Search`, `SortBy`, `SortDirection`.
- `CreateRuleRequest` y `UpdateRuleRequest`: `name`, `entityLevel`, `metric`, `operator`, `threshold`, `action`, `isActive`.

Qué hacer:
1. Confirma que el servicio no agregue operaciones fuera de Swagger.
2. Verifica que el filtro de estado use boolean real hacia backend.
3. Revisa que formulario y listado trabajen con enums/valores compatibles con Swagger.
4. Mantén el flujo actual de activar/desactivar, edición y recarga del listado.
5. Si detectas discrepancias de tipos, corrígelas de punta a punta.
6. Entrega el código final aplicado directamente en el proyecto.
```

## Prompt 7 — Corregir CRUD y acciones de Meta Connections según Swagger

```text
Corrige únicamente el módulo de Meta Connections para que quede alineado con `src/swagger/swagger.json`, sin romper la arquitectura actual del proyecto Angular.

Archivos a revisar:
- `src/app/shared/models/api.models.ts`
- `src/app/core/api/services/meta.service.ts`
- `src/app/features/meta-connections/pages/*`
- `src/app/features/meta-connections/components/*`

Swagger define estas operaciones:
- `GET /api/v1/meta/connections`
- `POST /api/v1/meta/connections`
- `PUT /api/v1/meta/connections/{id}`
- `DELETE /api/v1/meta/connections/{id}`
- `POST /api/v1/meta/connections/{id}/refresh-token`
- `POST /api/v1/meta/connections/{id}/validate`

Payloads:
- `CreateMetaConnectionRequest`: `appId`, `appSecret`, `accessToken`, `refreshToken`, `tokenExpiration`, `businessId`
- `UpdateMetaConnectionRequest`: `appId`, `appSecret`, `accessToken`, `refreshToken`, `tokenExpiration`, `businessId`

Objetivo:
1. Confirmar que tipos, formulario, servicio y acciones coincidan exactamente con Swagger.
2. Validar manejo de `tokenExpiration` y su transformación desde/hacia el formulario.
3. Mantener las acciones adicionales `refresh-token` y `validate` como operaciones separadas del CRUD.
4. Revisar que create y edit compartan correctamente el formulario sin enviar campos espurios.
5. Mantener feedback visual y recarga del listado según el patrón actual del proyecto.
6. Entrega los cambios listos para compilar.
```
