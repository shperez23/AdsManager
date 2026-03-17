import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  DashboardSummary,
  InsightsResponse,
  PaginationQueryParams,
} from '../../../shared/models';
import { BaseApiService } from './base-api.service';

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
    return this.baseApiService.get<InsightsResponse>(`${this.endpoint}/insights`, { params });
  }

  getDashboardReport(dateFrom?: string, dateTo?: string): Observable<DashboardSummary> {
    return this.baseApiService.get<DashboardSummary>(`${this.endpoint}/dashboard`, {
      params: { dateFrom, dateTo },
    });
  }
}
