import { InsightMetrics, InsightsResponse } from '../models';

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
  const rowsRaw = source['rows'] ?? source['Rows'] ?? source['data'] ?? source['Data'];
  const rows = Array.isArray(rowsRaw) ? rowsRaw.map((row) => normalizeInsightMetrics(row)) : [];

  return {
    accountId: readString(source, 'accountId', 'AccountId'),
    campaignId: readString(source, 'campaignId', 'CampaignId'),
    adSetId: readString(source, 'adSetId', 'AdSetId'),
    adId: readString(source, 'adId', 'AdId'),
    currency: readString(source, 'currency', 'Currency'),
    rows,
  };
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
