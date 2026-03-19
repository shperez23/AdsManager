# Roadmap final de cierre Frontend vs Swagger

## Contexto arquitectónico detectado

- Frontend Angular con arquitectura **modular por feature** (`features/*`) y componentes standalone.
- Capa de infraestructura HTTP en `core/api/services` con contratos tipados.
- Capa compartida (`shared/*`) para modelos/UI reutilizable.
- Patrón predominante: **presentación + servicios API + modelos compartidos**, sin estado global complejo centralizado.

---

## Checklist técnico listo para ejecución

> Convención de prioridad:
> - **P0** = bloqueante para operación/consistencia funcional.
> - **P1** = alto impacto funcional/técnico.
> - **P2** = mejora de robustez/UX/operación.

### Fase 0 — Alineación de contrato y baseline (orden 1)

- [ ] **[P0] Congelar contrato OpenAPI objetivo** (`v1`) y definir endpoint canónico para dashboard (`/dashboard` vs `/reports/dashboard`).
  - **Dependencias:** ninguna.
  - **Entregable:** matriz única de endpoints “fuente de verdad” (Swagger + decisión de negocio).

- [ ] **[P0] Auditar cobertura real frontend↔swagger por endpoint y método** (implementado/parcial/faltante/deprecado).
  - **Dependencias:** contrato congelado.
  - **Entregable:** tabla de gap cerrada con responsables por módulo.

- [ ] **[P0] Definir estrategia de parámetros homogéneos** (`dateFrom/dateTo`, `page/pageSize`, sort/filter por recurso).
  - **Dependencias:** contrato congelado.
  - **Entregable:** estándar de query params versionado en frontend.

### Fase 1 — Cierre funcional núcleo comercial (orden 2)

- [ ] **[P0] Dashboard real conectado a API** (eliminar métricas mock y consumir endpoint canónico).
  - **Dependencias:** Fase 0 completada.
  - **Entregable:** dashboard con datos reales + estados loading/error/empty.

- [ ] **[P0] Completar Insights transversales**
  - Ads (validar flujo completo existente).
  - AdSets (activar vista UI ya soportada por servicio).
  - Campaigns (crear integración end-to-end).
  - **Dependencias:** contrato de insights unificado de Fase 0.
  - **Entregable:** experiencia de insights por entidad con filtros consistentes.

- [ ] **[P0] Completar módulo Campaigns en UI**
  - Listado + filtros + paginación + orden.
  - Crear/editar.
  - Acciones `pause/activate`.
  - Vista de insights.
  - **Dependencias:** Fase 0.
  - **Entregable:** paridad funcional campaigns vs swagger.

- [ ] **[P1] Completar detalle de Ad Account**
  - Navegación real desde listado.
  - Carga de entidades relacionadas (ads/adsets/campaigns) por endpoint, no por filtro local.
  - **Dependencias:** contratos de listados y filtros cerrados.
  - **Entregable:** detalle navegable con información relacionada real.

### Fase 2 — Módulos de plataforma (orden 3)

- [ ] **[P1] Implementar Auth end-to-end**
  - `login/register/refresh/me`.
  - Guard de rutas + interceptor con refresh controlado.
  - **Dependencias:** definición de flujos de sesión y manejo de errores global.
  - **Entregable:** autenticación operativa y consistente.

- [ ] **[P1] Implementar Meta Connections + operaciones Meta**
  - CRUD conexiones.
  - `validate` y `refresh-token`.
  - Operaciones de sincronización/creación según swagger.
  - **Dependencias:** Auth activa y permisos definidos.
  - **Entregable:** módulo de integración Meta operativo.

- [ ] **[P1] Implementar Rules module**
  - listado/alta/edición.
  - `activate/deactivate`.
  - **Dependencias:** Auth + modelo de campañas/ads/adsets estable.
  - **Entregable:** automatizaciones configurables desde UI.

- [ ] **[P1] Implementar Reports module**
  - `/reports/insights` con tabla paginada y filtros.
  - `/reports/dashboard` si queda como endpoint oficial agregado.
  - **Dependencias:** Insights unificados + decisión endpoint canónico.
  - **Entregable:** reporting consolidado para operación/gestión.

### Fase 3 — Hardening técnico y consistencia arquitectónica (orden 4)

- [ ] **[P1] Estandarizar manejo de errores y notificaciones** en todos los submits CRUD.
  - **Dependencias:** módulos funcionales fase 1 y 2.
  - **Entregable:** política homogénea de errores (toast + estado inline).

- [ ] **[P1] Estandarizar lifecycle RxJS** (`takeUntilDestroyed` o patrón único equivalente).
  - **Dependencias:** revisión transversal de componentes/pages.
  - **Entregable:** menor riesgo de fugas y patrón consistente.

- [ ] **[P1] Separar tipos de query por recurso** (evitar params sobrantes y drift de contrato).
  - **Dependencias:** Fase 0 completada.
  - **Entregable:** DTOs de consulta específicos por dominio.

- [ ] **[P2] Añadir mapeadores DTO→ViewModel** para desacoplar UI del contrato crudo.
  - **Dependencias:** contratos estabilizados.
  - **Entregable:** capa anti-corrupción para cambios futuros del backend.

### Fase 4 — Calidad, observabilidad y release (orden 5)

- [ ] **[P0] Pruebas de integración HTTP por servicio**
  - endpoint + método + payload + manejo de error.
  - casos de filtros/paginación/insights.
  - **Dependencias:** fases funcionales completadas.
  - **Entregable:** suite de regresión de integración API.

- [ ] **[P1] Pruebas E2E de journeys críticos**
  - login, dashboard, CRUD campaigns/ads/adsets, insights, rules.
  - **Dependencias:** Auth y módulos núcleo terminados.
  - **Entregable:** cobertura de flujos de negocio críticos.

- [ ] **[P1] Telemetría funcional mínima**
  - errores de API por módulo, tiempos de carga, ratio de fallos por acción.
  - **Dependencias:** manejo de errores estandarizado.
  - **Entregable:** visibilidad operativa para producción.

- [ ] **[P0] Plan de release incremental por feature flags**
  - despliegue por lotes (dashboard → campaigns → reports/rules/meta).
  - fallback y rollback definidos.
  - **Dependencias:** QA y observabilidad activos.
  - **Entregable:** salida controlada a producción.

---

## Dependencias críticas (ruta feliz)

1. Contrato OpenAPI canónico y parámetros homogéneos.
2. Dashboard + insights + campaigns (núcleo operativo).
3. Auth (si no está activa) para habilitar módulos de plataforma.
4. Meta/Rules/Reports sobre base funcional estable.
5. Hardening transversal (errores, RxJS, tipado query, mapeo DTO).
6. Testing/observabilidad y release por etapas.

---

## Orden de implementación recomendado (secuencial ejecutable)

1. **Semana 1:** Fase 0 completa.
2. **Semanas 2-3:** Fase 1 (dashboard real + insights + campaigns + detalle ad account).
3. **Semanas 4-5:** Fase 2 (auth/meta/rules/reports según dependencia de negocio).
4. **Semana 6:** Fase 3 (hardening técnico transversal).
5. **Semana 7:** Fase 4 (QA integral + observabilidad + release gradual).

---

## Criterio de “sistema completo”

Se considera completo cuando:

- existe paridad funcional con Swagger en recursos priorizados;
- dashboard e insights funcionan con datos reales;
- módulos de auth/meta/reports/rules están operativos;
- cobertura de pruebas protege integraciones críticas;
- release está instrumentado con métricas y rollback.
