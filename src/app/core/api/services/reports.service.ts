import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  DashboardQueryParams,
  DashboardSummary,
  InsightsReportQueryParams,
  InsightsReportResponse,
} from '../../../shared/models';
import { normalizeDashboardSummary } from '../../../shared/utils/dashboard.util';
import { normalizeInsightsReportResponse } from '../../../shared/utils/insights.util';
import {
  mapDashboardQueryParams,
  mapInsightsReportQueryParams,
} from '../mappers/query-params.mapper';
import {
  mapDashboardSummaryDtoToViewModel,
  mapInsightsReportResponseDtoToViewModel,
} from '../mappers/resource-view-model.mapper';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly endpoint = 'reports';

  constructor(private readonly baseApiService: BaseApiService) {}

  getInsightsReport(params?: InsightsReportQueryParams): Observable<InsightsReportResponse> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/insights`, { params: mapInsightsReportQueryParams(params) })
      .pipe(
        map((response) => normalizeInsightsReportResponse(response)),
        map(mapInsightsReportResponseDtoToViewModel),
      );
  }

  getDashboardReport(params?: DashboardQueryParams): Observable<DashboardSummary> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/dashboard`, {
        params: mapDashboardQueryParams(params),
      })
      .pipe(
        map((response) => normalizeDashboardSummary(response)),
        map(mapDashboardSummaryDtoToViewModel),
      );
  }
}
