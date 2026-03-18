import { InsightMetrics, InsightsReportResponse, InsightsResponse } from '../models';

type UnknownRecord = Record<string, unknown>;

export interface DateRangeFilter {
  dateFrom: string;
  dateTo: string;
}

export function createDefaultDateRange(daysBack = 7): DateRangeFilter {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - daysBack);

  return {
    dateFrom: toDateInput(start),
    dateTo: toDateInput(end),
  };
}

export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function normalizeInsightsResponse(payload: unknown): InsightsResponse {
  if (!payload || typeof payload !== 'object') {
    return { rows: [] };
  }

  const source = payload as UnknownRecord;
  const rows = readInsightRows(source);

  return {
    accountId: readString(source, 'accountId', 'AccountId'),
    campaignId: readString(source, 'campaignId', 'CampaignId'),
    adSetId: readString(source, 'adSetId', 'AdSetId'),
    adId: readString(source, 'adId', 'AdId'),
    currency: readString(source, 'currency', 'Currency'),
    rows,
  };
}

export function normalizeInsightsReportResponse(payload: unknown): InsightsReportResponse {
  const response = normalizeInsightsResponse(payload);
  const source = (payload ?? {}) as UnknownRecord;
  const totalItems = readNumber(source, 'totalItems', 'TotalItems', 'count', 'Count');
  const pageSize = Math.max(readNumber(source, 'pageSize', 'PageSize', 'limit', 'Limit'), response.rows.length || 20);
  const page = Math.max(readNumber(source, 'page', 'Page', 'currentPage', 'CurrentPage'), 1);
  const computedTotalItems = totalItems || response.rows.length;
  const totalPages = Math.max(
    readNumber(source, 'totalPages', 'TotalPages') || Math.ceil(computedTotalItems / Math.max(pageSize, 1)),
    1,
  );

  return {
    ...response,
    page,
    pageSize,
    totalItems: computedTotalItems,
    totalPages,
    hasNext: readBoolean(source, 'hasNext', 'HasNext') ?? page < totalPages,
    hasPrevious: readBoolean(source, 'hasPrevious', 'HasPrevious') ?? page > 1,
  };
}

function readInsightRows(source: UnknownRecord): InsightMetrics[] {
  const rowsRaw = source['rows'] ?? source['Rows'] ?? source['items'] ?? source['Items'] ?? source['data'] ?? source['Data'];
  return Array.isArray(rowsRaw) ? rowsRaw.map((row) => normalizeInsightMetrics(row)) : [];
}

function normalizeInsightMetrics(row: unknown): InsightMetrics {
  const source = (row ?? {}) as UnknownRecord;
  const dateStart = readString(source, 'dateStart', 'DateStart', 'date_start') ?? '';
  const dateEnd = readString(source, 'dateEnd', 'DateEnd', 'date_stop', 'date_end') ?? dateStart;

  return {
    dateStart,
    dateEnd,
    impressions: readNumber(source, 'impressions', 'Impressions'),
    clicks: readNumber(source, 'clicks', 'Clicks'),
    spend: readNumber(source, 'spend', 'Spend'),
    conversions: readOptionalNumber(source, 'conversions', 'Conversions'),
    ctr: readOptionalNumber(source, 'ctr', 'Ctr'),
    cpc: readOptionalNumber(source, 'cpc', 'Cpc'),
    cpm: readOptionalNumber(source, 'cpm', 'Cpm'),
    reach: readOptionalNumber(source, 'reach', 'Reach'),
    frequency: readOptionalNumber(source, 'frequency', 'Frequency'),
  };
}

function readString(source: UnknownRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
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

function readOptionalNumber(source: UnknownRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    if (!(key in source)) {
      continue;
    }
    return readNumber(source, key);
  }

  return undefined;
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
