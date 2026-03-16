import { PaginationResponse } from './pagination-response.model';

export interface InsightMetrics {
  dateStart: string;
  dateEnd: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  reach?: number;
  frequency?: number;
  conversions?: number;
  actions?: Record<string, number>;
}

export interface InsightsResponse {
  accountId: string;
  adSetId?: string;
  adId?: string;
  currency?: string;
  rows: InsightMetrics[];
  pagination?: PaginationResponse<InsightMetrics>;
}
