import {
  AdAccountsQueryParams,
  AdsQueryParams,
  AdSetsQueryParams,
  CampaignsQueryParams,
  DashboardQueryParams,
  InsightsReportQueryParams,
  PaginationQueryParams,
  RulesQueryParams,
} from '../../../shared/models';

export type ResourceQueryParams =
  | PaginationQueryParams
  | AdAccountsQueryParams
  | AdsQueryParams
  | AdSetsQueryParams
  | CampaignsQueryParams
  | RulesQueryParams;

export function mapPaginationQueryParams(params?: PaginationQueryParams): PaginationQueryParams | undefined {
  return compactQueryParams(params);
}

export function mapAdAccountsQueryParams(params?: AdAccountsQueryParams): AdAccountsQueryParams | undefined {
  return compactQueryParams(params);
}

export function mapAdsQueryParams(params?: AdsQueryParams): AdsQueryParams | undefined {
  return compactQueryParams(params);
}

export function mapAdSetsQueryParams(params?: AdSetsQueryParams): AdSetsQueryParams | undefined {
  return compactQueryParams(params);
}

export function mapCampaignsQueryParams(params?: CampaignsQueryParams): CampaignsQueryParams | undefined {
  return compactQueryParams(params);
}

export function mapRulesQueryParams(params?: RulesQueryParams): RulesQueryParams | undefined {
  return compactQueryParams(params);
}

export function mapDashboardQueryParams(params?: DashboardQueryParams): DashboardQueryParams | undefined {
  return compactQueryParams(params);
}

export function mapInsightsReportQueryParams(
  params?: InsightsReportQueryParams,
): Record<string, string | number | boolean> | undefined {
  if (!params) {
    return undefined;
  }

  const nextParams: Record<string, string | number | boolean | undefined> = {
    AdAccountId: params.adAccountId,
    CampaignId: params.campaignId,
    DateFrom: params.dateFrom,
    DateTo: params.dateTo,
    Page: params.Page,
    PageSize: params.PageSize,
    Search: params.Search,
    SortBy: params.SortBy,
    SortDirection: params.SortDirection,
  };

  return compactQueryParams(nextParams) as Record<string, string | number | boolean> | undefined;
}

function compactQueryParams<T extends object>(params?: T): T | undefined {
  if (!params) {
    return undefined;
  }

  const nextEntries = Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '');

  if (!nextEntries.length) {
    return undefined;
  }

  return Object.fromEntries(nextEntries) as T;
}
