import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DashboardSummary } from '../../../shared/models';
import { BaseApiService } from './base-api.service';

export interface DashboardQueryParams {
  dateFrom?: string;
  dateTo?: string;
  campaignId?: string;
  adAccountId?: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly baseApiService: BaseApiService) {}

  getDashboard(params?: DashboardQueryParams): Observable<DashboardSummary> {
    return this.baseApiService.get<DashboardSummary>('dashboard', { params });
  }
}
