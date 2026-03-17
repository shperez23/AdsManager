# Auditoría de integración Frontend-Backend (Angular)

## Arquitectura detectada

El proyecto usa una arquitectura **modular por features** con capas transversales:

- `core/api`: capa de infraestructura HTTP (servicios, interceptor, base API).
- `features/*`: capa de presentación y orquestación por dominio funcional (`ads`, `ad-sets`, `ad-accounts`, `dashboard`).
- `shared/*`: modelos y UI reutilizable.

## Hallazgos de integración

### 1) Datos mock/hardcodeados en Dashboard

El `DashboardPageComponent` expone métricas estáticas (`Spend total`, `CTR promedio`, `ROAS`) y no consume ningún endpoint del backend.

Impacto:
- No refleja datos reales de negocio.
- Puede confundir al usuario sobre el estado real de campañas.

### 2) Ruta de Insights no apunta a un módulo/página de insights dedicada

La ruta `/insights` renderiza `AdsPageComponent` en lugar de una página específica de insights.

Impacto:
- Acoplamiento funcional entre Ads e Insights.
- Riesgo de UX inconsistente y futura deuda técnica al crecer la funcionalidad.

### 3) Detalle de Ad Account con integración incompleta

`AdaccountDetailComponent` solicita el listado de ad accounts y filtra por ID localmente, pero:
- no está cableado desde su page/container (se emite `viewDetail`, pero no hay consumidor);
- inicializa `ads` y `adSets` en vacío sin pedir datos de endpoints de Ads/AdSets relacionados.

Impacto:
- El detalle no se muestra en flujo real.
- La vista de detalle no trae entidades relacionadas, aun cuando existen servicios para Ads/AdSets.

### 4) Manejo de errores incompleto en flujos de submit

En `AdsPageComponent` y `AdSetsPageComponent` los `subscribe` de creación/edición no manejan `error`.

Impacto:
- Fallos silenciosos en UI.
- No hay feedback explícito para el usuario (toast/mensaje inline) cuando falla create/update.

### 5) Patrón Observable correcto en listas, pero inconsistente en páginas

En componentes de listas (`adaccounts-list`, `adsets-list`, `ads-list`, `ad-insights-dashboard`) se usa correctamente `takeUntil` + `finalize`.

En `AdsPageComponent` y `AdSetsPageComponent` no se aplica `takeUntil` (ni `DestroyRef/takeUntilDestroyed`), dejando un patrón inconsistente en el proyecto.

Impacto:
- Mayor riesgo de fugas de suscripción en navegación rápida o cambios futuros.

### 6) Loading states bien implementados en listas, insuficientes para errores de submit

Hay estados de carga/error para tablas y dashboard de insights, pero en submit de formularios (Ads/AdSets) falta estado de error visible.

Impacto:
- El usuario ve spinner/botón deshabilitado, pero no entiende por qué falló la acción.

## Mejoras necesarias (priorizadas)

1. **Conectar Dashboard a backend real**
   - Consumir `/dashboard` o `/reports/dashboard` y eliminar métricas hardcodeadas.

2. **Separar ruta/página de Insights**
   - Crear `InsightsPageComponent` y mover allí la lógica de visualización de insights.

3. **Completar flujo de detalle de Ad Account**
   - Conectar evento `viewDetail` con un contenedor/página.
   - Cargar Ads y AdSets relacionados usando `AdsService`/`AdSetsService` con filtros por cuenta/campaña según contrato backend.

4. **Estandarizar manejo de errores en submits**
   - Agregar `error` en `subscribe` para `create/update`.
   - Mostrar feedback con `ToastService` o componente de error inline.

5. **Estandarizar lifecycle de Observables**
   - Usar `takeUntilDestroyed(inject(DestroyRef))` o `takeUntil` en todas las suscripciones de componentes.

6. **Homologar contratos de DTO para update/create**
   - Evitar casts forzados (`as UpdateAdSetRequest`) y tipar explícitamente payloads para prevenir drift con backend.

7. **Mejorar trazabilidad de integración**
   - Añadir pruebas de integración HTTP (HttpTestingController) que validen endpoint + método + payload + manejo de error en cada servicio de `core/api/services`.
