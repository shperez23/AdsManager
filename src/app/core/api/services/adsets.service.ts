import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  AdSet,
  CreateAdSetRequest,
  InsightsResponse,
  PaginatedResponse,
  AdSetsQueryParams,
  UpdateAdSetRequest,
} from '../../../shared/models';
import { BaseApiService } from './base-api.service';
import { normalizeInsightsResponse } from '../../../shared/utils/insights.util';

@Injectable({
  providedIn: 'root',
})
export class AdSetsService {
  private readonly endpoint = 'adsets';

  constructor(private readonly baseApiService: BaseApiService) {}

  getAdSets(params?: AdSetsQueryParams): Observable<PaginatedResponse<AdSet>> {
    return this.baseApiService.get<PaginatedResponse<AdSet>>(this.endpoint, { params });
  }

  createAdSet(payload: CreateAdSetRequest): Observable<AdSet> {
    return this.baseApiService.post<AdSet, CreateAdSetRequest>(this.endpoint, payload);
  }

  updateAdSet(id: string, payload: UpdateAdSetRequest): Observable<AdSet> {
    return this.baseApiService.put<AdSet, UpdateAdSetRequest>(`${this.endpoint}/${id}`, payload);
  }

  getAdSetById(id: string): Observable<AdSet> {
    return this.baseApiService.get<AdSet>(`${this.endpoint}/${id}`);
  }

  pauseAdSet(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/pause`, {});
  }

  activateAdSet(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/activate`, {});
  }

  getAdSetInsights(id: string, dateFrom?: string, dateTo?: string): Observable<InsightsResponse> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/${id}/insights`, {
        params: { dateFrom, dateTo },
      })
      .pipe(map((response) => normalizeInsightsResponse(response)));
  }
}
