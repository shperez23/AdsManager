# Auditoría de integración de Insights (Swagger vs Angular)

## Resumen ejecutivo

- El frontend **sí consume** insights por anuncio (`/api/v1/ads/{id}/insights`) mediante `AdsService.getAdInsights` y el componente `AdInsightsDashboardComponent`.
- La integración de insights es **parcial**: no se consumen endpoints de insights para **campaigns**, **adsets**, **meta/ad-accounts**, ni los endpoints agregados de **reports/dashboard** o **reports/insights**.
- `dateFrom` y `dateTo` se usan correctamente en insights de ads, con un selector de fechas y validación básica (`startDate <= endDate`).
- La visualización de métricas existe para 4 métricas (`impressions`, `clicks`, `conversions`, `spend`) y sus totales, pero el dashboard principal sigue mostrando métricas mock estáticas.

## Hallazgos por área

### 1) Integración de endpoints de insights

**Swagger expone múltiples endpoints relevantes:**

- Insights por entidad:
  - `/api/v1/ads/{id}/insights`
  - `/api/v1/adsets/{id}/insights`
  - `/api/v1/campaigns/{id}/insights`
  - `/api/v1/meta/ad-accounts/{adAccountId}/insights`
- Dashboard agregado:
  - `/api/v1/dashboard`
  - `/api/v1/reports/dashboard`
- Reporte de insights:
  - `/api/v1/reports/insights`

**Frontend actual:**

- `AdsService` implementa `getAdInsights(id, dateFrom?, dateTo?)`.
- `AdSetsService` implementa `getAdSetInsights(id, dateFrom?, dateTo?)`, pero no hay componente/página que lo renderice.
- No existe servicio para campaigns insights, reports insights/dashboard o meta ad-account insights.
- La ruta `/insights` redirige al mismo `AdsPageComponent`; no existe una página dedicada de insights consolidados.

### 2) Uso de `dateFrom` / `dateTo`

- En `AdInsightsDashboardComponent` se inicializa rango por defecto (`hoy - 7 días` a `hoy`).
- El componente invoca `adsService.getAdInsights(this.adId, this.startDate, this.endDate)`.
- Hay validación local: si `startDate > endDate`, bloquea la consulta y muestra error.
- El `BaseApiService` elimina parámetros `undefined`, por lo que solo se envían fechas si existen valores válidos.

### 3) Visualización de métricas

- En insights por anuncio hay:
  - KPIs acumulados: impresiones, clicks, conversiones, spend.
  - 4 gráficos en canvas para series temporales.
- Limitaciones visibles:
  - Los gráficos no tienen ejes, leyenda, tooltips ni formateo de fechas/moneda avanzado.
  - No hay comparación de periodos (WoW/MoM) ni indicadores de variación.
  - La página de dashboard principal muestra métricas hardcodeadas (`$248.2k`, `4.63%`, `3.9x`) y no provenientes de API.

## Qué falta en el dashboard

1. **Dashboard conectado a backend real** (hoy usa datos mock estáticos).
2. **Vista consolidada de insights** por campañas/adsets/adaccounts además de ads.
3. **Consumo de endpoints agregados** (`/dashboard` o `/reports/dashboard`) para métricas ejecutivas.
4. **Consumo de `/reports/insights`** para tablas paginadas, filtros, búsqueda y orden.
5. **Filtros globales coherentes** (rango de fechas, campaignId, adAccountId) compartidos entre widgets.
6. **Métricas derivadas de negocio** (CTR, CPC, CPM, CPA, ROAS) calculadas o provistas por API.
7. **Mejor UX analítico**: loading granular por widget, estados vacíos, comparativas, y exportación.

## Mejoras recomendadas (priorizadas)

### Prioridad alta

1. Crear `DashboardApiService` y conectar `DashboardPageComponent` con `/api/v1/dashboard` (o `/api/v1/reports/dashboard` según contrato final).
2. Reemplazar métricas hardcodeadas por datos reales de API.
3. Implementar un `InsightsFiltersStore` (o estado local compartido) para `dateFrom/dateTo/campaignId/adAccountId` y reutilizarlo en todos los widgets.
4. Añadir `CampaignsService.getCampaignInsights` y vistas para campaigns/adsets insights.

### Prioridad media

5. Añadir vista/tablero de tabla usando `/api/v1/reports/insights` con paginación, búsqueda y orden nativos.
6. Estandarizar nombres de parámetros en frontend para endpoints legacy vs v1 (evitar mezclas `DateFrom`/`dateFrom` en DTOs de consulta).
7. Añadir capa de mapeo de DTOs para desacoplar modelos UI del contrato crudo de Swagger.

### Prioridad baja

8. Mejorar gráficos (librería como Chart.js o ECharts para ejes, tooltips, series múltiples y comparación de periodos).
9. Agregar tests de integración HTTP para validar envío de `dateFrom/dateTo` y manejo de errores por widget.
10. Incorporar exportación CSV/XLSX y snapshots por rango para uso ejecutivo.

## Nota de arquitectura observada

El frontend sigue una arquitectura modular por features (`features/*`), con servicios API centralizados (`core/api/services`) y modelos compartidos (`shared/models`), consistente con un enfoque de capas en presentación + acceso a datos.
