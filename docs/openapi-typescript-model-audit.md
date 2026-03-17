# Auditoría de modelos TypeScript vs OpenAPI

## Alcance analizado
- Modelos TypeScript en `src/app/shared/models/api.models.ts`.
- Schemas OpenAPI en `src/swagger/swagger.json` (`components.schemas`).

## Resultado general
Se compararon **12 modelos TS exportados** contra **23 schemas OpenAPI**.

---

## 1) Inconsistencias detectadas

### 1.1 Nullabilidad (tipos potencialmente incompletos en TS)
En OpenAPI varios campos están definidos como `nullable: true`, mientras que en TypeScript se modelan como opcionales (`?`) pero **no aceptan `null` explícitamente**.

Modelos afectados:
- `CreateAdRequest`
  - `name`, `status`, `creativeJson`, `previewUrl`.
- `UpdateAdRequest`
  - `name`, `status`, `creativeJson`, `previewUrl`.
- `CreateAdSetRequest`
  - `name`, `status`, `billingEvent`, `optimizationGoal`, `targetingJson`, `bidStrategy`.
- `UpdateAdSetRequest`
  - `name`, `status`, `billingEvent`, `optimizationGoal`, `targetingJson`, `bidStrategy`, `startDate`, `endDate`.

> Impacto: si el backend devuelve o espera `null`, el tipado TS actual puede quedar desalineado (según estrategia de serialización usada por el frontend).

### 1.2 Cobertura parcial de OpenAPI
Solo hay correspondencia directa de nombres entre estos schemas OpenAPI y modelos TS:
- `SortDirection`
- `CreateAdRequest`
- `UpdateAdRequest`
- `CreateAdSetRequest`
- `UpdateAdSetRequest`

No se detectaron diferencias de campos entre estos pares, salvo el punto de nullabilidad anterior.

---

## 2) Modelos a corregir

1. `CreateAdRequest`
   - Ajustar propiedades nullable a `string | null` (u homogeneizar contrato para evitar `null`).
2. `UpdateAdRequest`
   - Igual ajuste de nullabilidad.
3. `CreateAdSetRequest`
   - Igual ajuste de nullabilidad.
4. `UpdateAdSetRequest`
   - Igual ajuste de nullabilidad para strings y fechas.

---

## 3) Modelos TS no utilizados por schemas OpenAPI (sin correspondencia en `components.schemas`)

- `PaginationQueryParams`
- `PaginatedResponse<T>`
- `AdAccount`
- `Ad`
- `AdSet`
- `InsightMetrics`
- `InsightsResponse`

> Nota: estos modelos pueden seguir siendo válidos para consumo interno del frontend, pero **no están respaldados por un schema nombrado** en `components.schemas` del swagger actual.

---

## 4) Modelos faltantes en `src/app/shared/models` respecto a OpenAPI

Schemas presentes en OpenAPI y no modelados en `src/app/shared/models/api.models.ts`:

- `CreateCampaignRequest`
- `CreateMetaConnectionRequest`
- `CreateRuleRequest`
- `LoginRequest`
- `MetaAdCreateRequest`
- `MetaAdSetCreateRequest`
- `MetaCampaignCreateRequest`
- `MetaCampaignStatusUpdateRequest`
- `ProblemDetails`
- `RefreshTokenRequest`
- `RegisterRequest`
- `RuleAction`
- `RuleEntityLevel`
- `RuleMetric`
- `RuleOperator`
- `UpdateCampaignRequest`
- `UpdateMetaConnectionRequest`
- `UpdateRuleRequest`

