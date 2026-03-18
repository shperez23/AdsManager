import { DashboardSummary } from '../models';

type UnknownRecord = Record<string, unknown>;

export function normalizeDashboardSummary(payload: unknown): DashboardSummary {
  const source = toRecord(payload);

  return {
    totalSpend: readNumber(source, 'totalSpend', 'TotalSpend'),
    totalClicks: readNumber(source, 'totalClicks', 'TotalClicks'),
    totalImpressions: readNumber(source, 'totalImpressions', 'TotalImpressions'),
    totalConversions: readNumber(source, 'totalConversions', 'TotalConversions'),
    ctr: readOptionalNumber(source, 'ctr', 'Ctr'),
    cpc: readOptionalNumber(source, 'cpc', 'Cpc'),
    cpm: readOptionalNumber(source, 'cpm', 'Cpm'),
    roas: readOptionalNumber(source, 'roas', 'Roas'),
  };
}

function readNumber(source: UnknownRecord | null, ...keys: string[]): number {
  if (!source) {
    return 0;
  }

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

function readOptionalNumber(source: UnknownRecord | null, ...keys: string[]): number | undefined {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    if (!(key in source)) {
      continue;
    }

    return readNumber(source, key);
  }

  return undefined;
}

function toRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}
