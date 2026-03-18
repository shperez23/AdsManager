import {
  Ad,
  AdAccount,
  AdSet,
  Campaign,
  DashboardSummary,
  InsightMetrics,
  InsightsReportResponse,
  InsightsResponse,
  MetaConnection,
  PaginatedResponse,
  Rule,
} from '../../../shared/models';

export function mapPaginatedResponseDtoToViewModel<TDto, TViewModel>(
  response: unknown,
  itemMapper: (item: TDto) => TViewModel,
): PaginatedResponse<TViewModel> {
  const normalizedResponse = normalizePaginatedResponse<TDto>(response);

  return {
    ...normalizedResponse,
    items: normalizedResponse.items.map(itemMapper),
  };
}

export function mapAdAccountDtoToViewModel(dto: unknown): AdAccount {
  const source = toRecord(dto);

  return {
    id: readString(source, 'id', 'Id') ?? '',
    name: readString(source, 'name', 'Name') ?? '',
    status: readString(source, 'status', 'Status') ?? '',
    currency: normalizeOptionalString(readUnknown(source, 'currency', 'Currency')),
    timezone: normalizeOptionalString(readUnknown(source, 'timezone', 'Timezone')),
    businessId: normalizeOptionalString(readUnknown(source, 'businessId', 'BusinessId')),
    createdAt: normalizeOptionalString(readUnknown(source, 'createdAt', 'CreatedAt')),
    updatedAt: normalizeOptionalString(readUnknown(source, 'updatedAt', 'UpdatedAt')),
  };
}

export function mapAdDtoToViewModel(dto: Ad): Ad {
  return { ...dto };
}

export function mapAdSetDtoToViewModel(dto: AdSet): AdSet {
  return { ...dto };
}

export function mapCampaignDtoToViewModel(dto: Campaign): Campaign {
  return {
    ...dto,
    objective: dto.objective ?? undefined,
    dailyBudget: normalizeOptionalNumber(dto.dailyBudget),
    lifetimeBudget: normalizeOptionalNumber(dto.lifetimeBudget),
    startDate: dto.startDate ?? undefined,
    endDate: dto.endDate ?? undefined,
  };
}

export function mapRuleDtoToViewModel(dto: Rule): Rule {
  return { ...dto };
}

export function mapDashboardSummaryDtoToViewModel(dto: DashboardSummary): DashboardSummary {
  return { ...dto };
}

export function mapInsightsResponseDtoToViewModel(dto: InsightsResponse): InsightsResponse {
  return {
    ...dto,
    rows: (dto.rows ?? []).map(mapInsightMetricsDtoToViewModel),
  };
}

export function mapInsightsReportResponseDtoToViewModel(dto: InsightsReportResponse): InsightsReportResponse {
  return {
    ...dto,
    rows: (dto.rows ?? []).map(mapInsightMetricsDtoToViewModel),
  };
}

export function mapMetaConnectionDtoToViewModel(dto: MetaConnection): MetaConnection {
  return {
    ...dto,
    tokenExpiration: normalizeOptionalDate(dto.tokenExpiration),
    createdAt: normalizeOptionalDate(dto.createdAt),
    updatedAt: normalizeOptionalDate(dto.updatedAt),
    status: normalizeOptionalString(dto.status),
  };
}

function mapInsightMetricsDtoToViewModel(dto: InsightMetrics): InsightMetrics {
  return { ...dto };
}

function normalizeOptionalNumber(value?: number | null): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeOptionalDate(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue || normalizedValue.startsWith('0001-01-01')) {
    return undefined;
  }

  return normalizedValue;
}

function normalizeOptionalString(value?: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

type UnknownRecord = Record<string, unknown>;

function normalizePaginatedResponse<TDto>(response: unknown): PaginatedResponse<TDto> {
  const source = toRecord(response);
  const items = readArray(source, 'items', 'Items', 'data', 'Data', 'result', 'Result', 'value', 'Value');
  const pageSize = Math.max(readNumber(source, 'pageSize', 'PageSize', 'limit', 'Limit'), items.length || 10);
  const page = Math.max(readNumber(source, 'page', 'Page', 'currentPage', 'CurrentPage'), 1);
  const totalItems = readNumber(source, 'totalItems', 'TotalItems', 'count', 'Count') || items.length;
  const totalPages = Math.max(
    readNumber(source, 'totalPages', 'TotalPages') || Math.ceil(totalItems / Math.max(pageSize, 1)),
    1,
  );

  return {
    items: items as TDto[],
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext: readBoolean(source, 'hasNext', 'HasNext') ?? page < totalPages,
    hasPrevious: readBoolean(source, 'hasPrevious', 'HasPrevious') ?? page > 1,
  };
}

function toRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : {};
}

function readArray(source: UnknownRecord, ...keys: string[]): unknown[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function readUnknown(source: UnknownRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in source) {
      return source[key];
    }
  }

  return undefined;
}

function readString(source: UnknownRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

function readNumber(source: UnknownRecord, ...keys: string[]): number {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function readBoolean(source: UnknownRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') {
        return true;
      }

      if (value.toLowerCase() === 'false') {
        return false;
      }
    }
  }

  return undefined;
}
