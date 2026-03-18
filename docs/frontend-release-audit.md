# Frontend release audit

## Veredicto ejecutivo

**Estado actual: NO listo para release.**

El frontend Angular muestra una base arquitectónica coherente y una cobertura funcional amplia en dominios clave (auth, dashboard, campañas, ads, ad sets, insights, reports, rules y meta connections), pero todavía tiene riesgos de salida a producción que afectan renderizado, despliegue, paridad funcional y calidad operativa.

## Arquitectura observada

- Arquitectura **modular por feature** con separación transversal en `core`, `features` y `shared`.
- `core` centraliza infraestructura de frontend: API clients, auth, interceptors, layout, configuración y notificaciones.
- `features` encapsula páginas y componentes por dominio (`ads`, `campaigns`, `reports`, etc.).
- `shared` contiene modelos, utilidades y componentes de estado reutilizables.
- Se usa Angular standalone components, guards, interceptors y SSR/prerender.

Conclusión arquitectónica: el proyecto sigue una **arquitectura modular orientada a features con capas transversales de infraestructura**, adecuada para crecer, pero con deuda técnica todavía visible en consistencia UX, cobertura de tests y estrategia de runtime.

## Hallazgos bloqueantes

### 1. La app depende visualmente de Tailwind, pero Tailwind no está instalado
- El código de UI utiliza clases utilitarias de Tailwind de forma masiva en shell, auth, dashboard y múltiples pantallas.
- Sin embargo, `package.json` no incluye `tailwindcss` ni plugins asociados.
- El build ya avisa explícitamente esta inconsistencia.
- Riesgo: degradación severa de estilos o UI inconsistente en producción.

### 2. SSR/prerender no es compatible con el modelo actual de auth basado en `localStorage`
- Toda la app SSR se prerenderiza con `RenderMode.Prerender` para todas las rutas.
- La sesión se hidrata exclusivamente desde `window.localStorage`.
- Los guards validan auth antes de entrar a las rutas privadas.
- Resultado práctico: en prerender no existe sesión y las rutas protegidas se resuelven como redirect a login, lo que hace incompatible el prerender universal con el acceso autenticado esperado.

### 3. La configuración productiva apunta a una URL hardcodeada que parece placeholder de infraestructura
- `environment.prod.ts` define `https://api.adsmanager.com` directamente.
- Si esta URL no está provisionada exactamente igual en release, el frontend quedará roto o acoplado a un host incorrecto.
- Recomendación: externalizar por deployment config o environment real del pipeline.

## Hallazgos importantes

### 4. Paridad con Swagger: buena en cliente API base, incompleta en experiencia funcional expuesta
- El cliente Angular sí implementa la mayoría de endpoints principales del swagger para auth, dashboard, reports, rules, ads, ad sets, campaigns, ad accounts y meta connections.
- Pero la navegación visible solo expone las secciones principales; no existe una UX dedicada para operar endpoints Meta de creación de campañas, ad sets y ads, aunque sí existen servicios para ellos.
- Adicionalmente, varios formularios frontend no exponen todos los campos que sí están modelados en swagger.

### 5. Paridad de campos incompleta en campañas y ad sets
- El swagger contempla para campañas campos como `objective`, `dailyBudget`, `lifetimeBudget`, `startDate` y `endDate`.
- El formulario actual de campañas solo captura `adAccountId`, `name` y `status`.
- Para ad sets, swagger incluye `billingEvent`, `optimizationGoal`, `targetingJson` y `bidStrategy`, pero la UI actual solo maneja `campaignId`, `name`, `status` y `dailyBudget`.
- Esto no rompe el contrato técnico mínimo, pero sí deja la experiencia funcional por debajo de la capacidad real del backend.

### 6. UX todavía mezcla producto real con contenido demo/manual
- El dashboard incluye tarjetas con textos y métricas estáticas como `Top Channel`, `126 campañas`, `CPA objetivo` y una sección `Toast system check` que parece de validación interna y no de producto final.
- Varias pantallas exigen IDs manuales (`Campaign ID`, `Ad Account ID`, `AdSet ID`) en lugar de selectores ligados a datos reales, lo que penaliza usabilidad y reduce seguridad operativa.

### 7. Cobertura de tests muy baja para el tamaño del frontend
- En el código actual solo existen dos archivos spec detectables: `app.spec.ts` y `auth-form.util.spec.ts`.
- No hay cobertura visible para guards, interceptors, services, páginas principales, flujos CRUD, estados de error o auth refresh.
- Para un release productivo, la cobertura funcional automatizada es insuficiente.

### 8. La suite de tests no pudo ejecutarse completamente en el entorno actual
- `ng test --watch=false --browsers=ChromeHeadless --code-coverage` falla porque no existe binario de ChromeHeadless disponible en el entorno.
- Esto impide validar cobertura real antes de release desde CI local de esta revisión.
- Debe resolverse en pipeline con navegador headless o runner alternativo.

### 9. Performance: bundle inicial ya excede el budget y todas las rutas están eager-loaded
- El budget productivo marca warning en 500 kB y el build actual genera un bundle inicial de 514.53 kB.
- Las rutas importan directamente todos los page components; no hay lazy loading por dominio.
- El proyecto puede compilar, pero llega al release con margen de performance ya consumido.

### 10. Auth correcto a nivel básico, pero con riesgos de endurecimiento pendientes
- Hay guard de autenticación, guard de invitado, interceptor de bearer token y refresh token.
- La sesión se persiste en `localStorage`, lo que mantiene exposición frente a XSS y limita una estrategia más robusta con cookies httpOnly o BFF.
- También existe doble acoplamiento entre refresh/logout y redirect por 401, lo que conviene simplificar antes de producción.

## Mejoras

### 11. Consistencia visual y de copy
- Coexisten pantallas con look & feel avanzado tipo dashboard oscuro y otras vistas CRUD más básicas tipo tabla/formulario blanca.
- Hay mezcla de idiomas en labels (`Validate`, `Refresh token`, `Logout`, `Campaign Intelligence Hub`).
- Conviene consolidar design system, tono de producto y glosario.

### 12. Hay residuos de estructura no utilizada
- Coexisten `App` y `AppComponent` como raíces distintas, lo que sugiere remanentes de iteraciones previas.
- No es crítico para release, pero sí para mantenibilidad.

### 13. Observabilidad y manejo global de errores pueden madurar
- El manejo de errores es mejor que el promedio: existe normalización de mensajes, toast feedback y estados reutilizables.
- Aun así, faltan trazas estructuradas, correlación con backend, y una política uniforme para errores silenciosos, reintentos y fallbacks por feature.

## Evaluación por criterio solicitado

### Paridad con Swagger
- **Backend client parity:** buena para los dominios principales.
- **UI parity:** parcial.
- **Conclusión:** no hay desalineación grave de endpoints base, pero sí brecha funcional entre lo que el backend permite y lo que la UI realmente deja operar.

### UX
- Visualmente prometedora, pero inconsistente.
- Formularios todavía demasiado técnicos para usuarios de negocio.
- Persisten elementos demo/no-producto en dashboard.
- **Conclusión:** no la considero lista para un release amplio a usuarios finales sin una pasada de productización.

### Manejo de errores
- Hay interceptors, normalización de errores y feedback con toasts/empty/error states.
- Es un punto relativamente sólido.
- Pendientes: unificar navegación/401 y mejorar observabilidad.
- **Conclusión:** aceptable como base, no todavía excelente para release enterprise.

### Auth
- Existe flujo completo login/register/me/refresh/logout.
- El mayor problema no es el flujo funcional sino su combinación con SSR/prerender y persistencia en localStorage.
- **Conclusión:** funcional pero no endurecido para release serio.

### Performance
- Bundle inicial por encima del warning.
- Sin lazy loading por rutas.
- SSR actual no está alineado con auth real.
- **Conclusión:** hay riesgo moderado y poco margen para crecer sin optimización.

### Test coverage
- Muy baja a nivel visible.
- Sin evidencia de cobertura de journeys críticos.
- Ejecución de cobertura bloqueada en este entorno por falta de navegador headless.
- **Conclusión:** no suficiente para aprobar release con confianza.

## Recomendación final

**Recomendación: no aprobar release todavía.**

Solo aprobaría salida a producción después de resolver como mínimo los bloqueantes y, además, cerrar al menos estos importantes: paridad funcional mínima de formularios críticos, lazy loading básico, limpieza de contenido demo y cobertura automatizada de auth + CRUD críticos.

## Checklist final de salida a producción

### Bloqueantes antes de release
- [ ] Instalar/configurar correctamente Tailwind o eliminar la dependencia visual a sus clases.
- [ ] Corregir la estrategia SSR/prerender para rutas autenticadas.
- [ ] Confirmar y externalizar la URL real del backend productivo.

### Obligatorios recomendados antes de release
- [ ] Alinear formularios de campañas y ad sets con los campos relevantes del swagger.
- [ ] Decidir si los endpoints Meta de creación deben tener UI o quedar explícitamente fuera de alcance del release.
- [ ] Eliminar contenido demo/interno del dashboard.
- [ ] Reemplazar inputs manuales de IDs por selectores/autocomplete donde aplique.
- [ ] Añadir lazy loading por feature o justificar técnicamente que no se usará.
- [ ] Bajar bundle inicial por debajo del budget o actualizar budgets con criterio técnico formal.
- [ ] Añadir tests automatizados para auth guards/interceptors/session refresh.
- [ ] Añadir tests para páginas críticas: login, register, dashboard, ads/campaigns/rules.
- [ ] Ejecutar coverage real en CI con navegador headless disponible.

### Recomendados para endurecimiento
- [ ] Revisar persistencia de tokens y evaluar cookies httpOnly/BFF.
- [ ] Unificar idioma, tono y design system.
- [ ] Eliminar componentes/raíces residuales no usadas.
- [ ] Añadir telemetría y trazabilidad de errores frontend.
