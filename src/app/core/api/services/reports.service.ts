import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  DashboardSummary,
  InsightsReportQueryParams,
  InsightsReportResponse,
} from '../../../shared/models';
import { normalizeInsightsReportResponse } from '../../../shared/utils/insights.util';
import { mapInsightsReportQueryParams } from '../mappers/query-params.mapper';
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

  getDashboardReport(dateFrom?: string, dateTo?: string): Observable<DashboardSummary> {
    return this.baseApiService
      .get<DashboardSummary>(`${this.endpoint}/dashboard`, {
        params: { dateFrom, dateTo },
      })
      .pipe(map(mapDashboardSummaryDtoToViewModel));
  }
}
