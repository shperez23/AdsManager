import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DashboardSummary } from '../../../shared/models';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly baseApiService: BaseApiService) {}

  getDashboard(dateFrom?: string, dateTo?: string): Observable<DashboardSummary> {
    return this.baseApiService.get<DashboardSummary>('dashboard', { params: { dateFrom, dateTo } });
  }
}
