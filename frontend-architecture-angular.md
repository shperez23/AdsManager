# Arquitectura Frontend Angular para plataforma de gestión de anuncios

> Análisis del repositorio actual: no existe una app Angular implementada aún (solo documentación inicial), por lo que esta propuesta define una arquitectura **modular feature-first** alineada con la base sugerida en `angular-adsmanager-setup.md` (capas `core`, `shared`, `features`).

## 1) Arquitectura objetivo

- **Estilo principal**: Arquitectura modular por features + separación por capas (`core/shared/features`).
- **Patrón de dominio en frontend**: `data-access` (infra/API), `domain` (tipos y reglas), `ui` (presentación).
- **Escalabilidad**: cada recurso de API se implementa como feature independiente:
  - `ad-accounts`
  - `ads`
  - `ad-sets`
- **Consistencia transversal** en autenticación, errores, trazabilidad y configuración desde `core`.

---

## 2) Estructura completa de carpetas

```text
src/
  app/
    app.component.ts
    app.component.html
    app.routes.ts

    core/
      api/
        api-client.service.ts
        endpoints.ts
        interceptors/
          auth.interceptor.ts
          error.interceptor.ts
          correlation-id.interceptor.ts
      auth/
        auth.service.ts
        auth.store.ts
      config/
        app-config.token.ts
        environment.token.ts
      guards/
        auth.guard.ts
      http/
        http-error.mapper.ts
      layout/
        shell/
          shell.component.ts
          shell.component.html
      logger/
        logger.service.ts

    shared/
      ui/
        button/
          ui-button.component.ts
          ui-button.component.html
        status-badge/
          ui-status-badge.component.ts
        table/
          ui-table.component.ts
      pipes/
        currency-usd.pipe.ts
        short-number.pipe.ts
      directives/
        has-permission.directive.ts
      utils/
        date.util.ts
        object.util.ts
      models/
        api-response.model.ts
        pagination.model.ts

    features/
      dashboard/
        pages/
          dashboard-page.component.ts

      ad-accounts/
        ad-accounts.routes.ts
        domain/
          models/
            ad-account.model.ts
            ad-account-insights.model.ts
          enums/
            ad-account-status.enum.ts
        data-access/
          dto/
            create-ad-account.dto.ts
            update-ad-account.dto.ts
            ad-account-response.dto.ts
          mappers/
            ad-account.mapper.ts
          services/
            ad-accounts-api.service.ts
        state/
          ad-accounts.store.ts
        pages/
          ad-accounts-list-page.component.ts
          ad-account-detail-page.component.ts
          ad-account-create-page.component.ts
          ad-account-edit-page.component.ts
        components/
          ad-accounts-table.component.ts
          ad-account-form.component.ts
          ad-account-actions-menu.component.ts

      ads/
        ads.routes.ts
        domain/
          models/
            ad.model.ts
            ad-insights.model.ts
          enums/
            ad-status.enum.ts
        data-access/
          dto/
            create-ad.dto.ts
            update-ad.dto.ts
            ad-response.dto.ts
          mappers/
            ad.mapper.ts
          services/
            ads-api.service.ts
        state/
          ads.store.ts
        pages/
          ads-list-page.component.ts
          ad-detail-page.component.ts
          ad-create-page.component.ts
          ad-edit-page.component.ts
        components/
          ads-table.component.ts
          ad-form.component.ts
          ad-actions-menu.component.ts

      ad-sets/
        ad-sets.routes.ts
        domain/
          models/
            ad-set.model.ts
            ad-set-insights.model.ts
          enums/
            ad-set-status.enum.ts
        data-access/
          dto/
            create-ad-set.dto.ts
            update-ad-set.dto.ts
            ad-set-response.dto.ts
          mappers/
            ad-set.mapper.ts
          services/
            ad-sets-api.service.ts
        state/
          ad-sets.store.ts
        pages/
          ad-sets-list-page.component.ts
          ad-set-detail-page.component.ts
          ad-set-create-page.component.ts
          ad-set-edit-page.component.ts
        components/
          ad-sets-table.component.ts
          ad-set-form.component.ts
          ad-set-actions-menu.component.ts
```

---

## 3) Responsabilidad de cada módulo/capa

## `core/` (singletons y cross-cutting)

- Aloja servicios **globales** y de ciclo de vida único.
- Incluye:
  - Cliente HTTP base y composición de endpoints.
  - Interceptores globales (`auth`, `error`, `correlation-id`).
  - Guards, config y tokens de entorno.
- **No** debe contener lógica de negocio específica de `ad-accounts`, `ads` o `ad-sets`.

## `shared/` (reutilizable y agnóstico de negocio)

- Componentes UI atómicos y reutilizables.
- Pipes/directivas/utilidades sin dependencia de una feature concreta.
- Modelos transversales (`pagination`, `api-response`).
- Regla: `shared` nunca importa desde `features`.

## `features/` (dominio funcional)

Cada feature encapsula completamente su vertical:

- `domain/`: contratos del dominio UI (modelos/enums).
- `data-access/`: comunicación API REST, DTOs, mappers.
- `state/`: estado de la feature (Signals Store o RxJS store).
- `pages/`: páginas enrutable.
- `components/`: piezas visuales propias de la feature.

Esto permite evolucionar cada recurso (`ad-accounts`, `ads`, `ad-sets`) sin acoplarlos entre sí.

---

## 4) Contrato de servicios por recurso

Para cada recurso se recomienda un API service con este contrato mínimo:

- `list(params?)`
- `getById(id)`
- `create(payload)`
- `update(id, payload)`
- `pause(id)`
- `activate(id)`
- `sync(id)`
- `insights(id, range?)`

Ejemplo de endpoints REST:

- `GET /ad-accounts`
- `GET /ad-accounts/:id`
- `POST /ad-accounts`
- `PUT /ad-accounts/:id`
- `POST /ad-accounts/:id/pause`
- `POST /ad-accounts/:id/activate`
- `POST /ad-accounts/:id/sync`
- `GET /ad-accounts/:id/insights`

Replicar exactamente la misma semántica para `ads` y `ad-sets`.

---

## 5) Convención de nombres

## Carpetas

- Feature en **kebab-case plural**:
  - `ad-accounts`, `ad-sets`, `ads`.
- Subcapas estables por feature:
  - `domain`, `data-access`, `state`, `pages`, `components`.

## Archivos TypeScript

- Componentes: `*.component.ts`
- Servicios: `*.service.ts`
- Stores: `*.store.ts`
- Modelos: `*.model.ts`
- DTOs: `*.dto.ts`
- Mappers: `*.mapper.ts`
- Enums: `*.enum.ts`
- Guards: `*.guard.ts`
- Interceptores: `*.interceptor.ts`

## Símbolos

- Clases/componentes/servicios: `PascalCase`
  - `AdAccountsApiService`, `AdSetFormComponent`
- Variables/funciones/métodos: `camelCase`
  - `getById`, `loadAds`, `pauseAdSet`
- Constantes globales: `UPPER_SNAKE_CASE`
  - `DEFAULT_PAGE_SIZE`
- Selectores de componentes UI:
  - prefijo de diseño, p.ej. `ui-` para shared y `feature-` para feature.

## Rutas

- URL en kebab-case y plural para listados:
  - `/ad-accounts`, `/ads`, `/ad-sets`
- Detalle/edición:
  - `/ads/:id`, `/ads/:id/edit`

---

## 6) Reglas de diseño recomendadas

- DTOs y modelos de dominio separados (evita acoplar UI a API cruda).
- Mappers dedicados por recurso para transformación y normalización.
- Manejo de error unificado en interceptor + mapper de errores.
- `core` depende de nadie; `shared` depende de `core` solo si es imprescindible; `features` puede depender de `core/shared`.
- Cada acción (`pause`, `activate`, `sync`, `insights`) debe estar disponible:
  - en `data-access/services`
  - en `state` como comando
  - en `components` como interacción de usuario (botón/menú de acciones)

---

## 7) Resultado esperado

Con esta arquitectura obtienes:

- Alta mantenibilidad y onboarding rápido.
- Escalado limpio al añadir nuevos recursos (ej. `campaigns`, `creatives`).
- Menor deuda técnica al separar infraestructura, dominio y presentación.
- Coherencia con la estructura base ya sugerida en el repositorio.
