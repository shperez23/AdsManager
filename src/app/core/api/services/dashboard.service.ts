import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { DashboardQueryParams, DashboardSummary } from '../../../shared/models';
import { mapDashboardQueryParams } from '../mappers/query-params.mapper';
import { mapDashboardSummaryDtoToViewModel } from '../mappers/resource-view-model.mapper';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly baseApiService: BaseApiService) {}

  getDashboard(params?: DashboardQueryParams): Observable<DashboardSummary> {
    return this.baseApiService
      .get<DashboardSummary>('dashboard', { params: mapDashboardQueryParams(params) })
      .pipe(map(mapDashboardSummaryDtoToViewModel));
  }
}
