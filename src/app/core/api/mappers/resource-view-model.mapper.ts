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
  response: PaginatedResponse<TDto>,
  itemMapper: (item: TDto) => TViewModel,
): PaginatedResponse<TViewModel> {
  return {
    ...response,
    items: (response.items ?? []).map(itemMapper),
  };
}

export function mapAdAccountDtoToViewModel(dto: AdAccount): AdAccount {
  return { ...dto };
}

export function mapAdDtoToViewModel(dto: Ad): Ad {
  return { ...dto };
}

export function mapAdSetDtoToViewModel(dto: AdSet): AdSet {
  return { ...dto };
}

export function mapCampaignDtoToViewModel(dto: Campaign): Campaign {
  return { ...dto };
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
  return { ...dto };
}

function mapInsightMetricsDtoToViewModel(dto: InsightMetrics): InsightMetrics {
  return { ...dto };
}
