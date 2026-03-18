import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  DashboardSummary,
  InsightsReportResponse,
  PaginationQueryParams,
} from '../../../shared/models';
import { BaseApiService } from './base-api.service';
import { normalizeInsightsReportResponse } from '../../../shared/utils/insights.util';

export interface InsightsReportQueryParams extends PaginationQueryParams {
  dateFrom?: string;
  dateTo?: string;
  adAccountId?: string;
  campaignId?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly endpoint = 'reports';

  constructor(private readonly baseApiService: BaseApiService) {}

  getInsightsReport(params?: InsightsReportQueryParams): Observable<InsightsReportResponse> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/insights`, { params: this.serializeInsightsParams(params) })
      .pipe(map((response) => normalizeInsightsReportResponse(response)));
  }

  getDashboardReport(dateFrom?: string, dateTo?: string): Observable<DashboardSummary> {
    return this.baseApiService.get<DashboardSummary>(`${this.endpoint}/dashboard`, {
      params: { dateFrom, dateTo },
    });
  }

  private serializeInsightsParams(params?: InsightsReportQueryParams): Record<string, string | number> | undefined {
    if (!params) {
      return undefined;
    }

    const serialized: Record<string, string | number> = {};

    if (params.adAccountId) {
      serialized['AdAccountId'] = params.adAccountId;
    }

    if (params.campaignId) {
      serialized['CampaignId'] = params.campaignId;
    }

    if (params.dateFrom) {
      serialized['DateFrom'] = params.dateFrom;
    }

    if (params.dateTo) {
      serialized['DateTo'] = params.dateTo;
    }

    if (typeof params.Page === 'number') {
      serialized['Page'] = params.Page;
    }

    if (typeof params.PageSize === 'number') {
      serialized['PageSize'] = params.PageSize;
    }

    if (params.Search) {
      serialized['Search'] = params.Search;
    }

    if (params.SortBy) {
      serialized['SortBy'] = params.SortBy;
    }

    if (typeof params.SortDirection === 'number') {
      serialized['SortDirection'] = params.SortDirection;
    }

    return Object.keys(serialized).length ? serialized : undefined;
  }
}
