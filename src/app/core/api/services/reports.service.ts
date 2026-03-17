import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  DashboardSummary,
  InsightsResponse,
  PaginationQueryParams,
} from '../../../shared/models';
import { BaseApiService } from './base-api.service';
import { normalizeInsightsResponse } from '../../../shared/utils/insights.util';

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

  getInsightsReport(params?: InsightsReportQueryParams): Observable<InsightsResponse> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/insights`, { params })
      .pipe(map((response) => normalizeInsightsResponse(response)));
  }

  getDashboardReport(dateFrom?: string, dateTo?: string): Observable<DashboardSummary> {
    return this.baseApiService.get<DashboardSummary>(`${this.endpoint}/dashboard`, {
      params: { dateFrom, dateTo },
    });
  }
}
