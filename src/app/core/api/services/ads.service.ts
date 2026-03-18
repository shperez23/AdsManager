import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  Ad,
  AdsQueryParams,
  CreateAdRequest,
  InsightsResponse,
  PaginatedResponse,
  UpdateAdRequest,
} from '../../../shared/models';
import { normalizeInsightsResponse } from '../../../shared/utils/insights.util';
import { mapAdsQueryParams } from '../mappers/query-params.mapper';
import {
  mapAdDtoToViewModel,
  mapInsightsResponseDtoToViewModel,
  mapPaginatedResponseDtoToViewModel,
} from '../mappers/resource-view-model.mapper';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class AdsService {
  private readonly endpoint = 'ads';

  constructor(private readonly baseApiService: BaseApiService) {}

  getAds(params?: AdsQueryParams): Observable<PaginatedResponse<Ad>> {
    return this.baseApiService
      .get<PaginatedResponse<Ad>>(this.endpoint, { params: mapAdsQueryParams(params) })
      .pipe(map((response) => mapPaginatedResponseDtoToViewModel(response, mapAdDtoToViewModel)));
  }

  createAd(payload: CreateAdRequest): Observable<Ad> {
    return this.baseApiService.post<Ad, CreateAdRequest>(this.endpoint, payload).pipe(map(mapAdDtoToViewModel));
  }

  updateAd(id: string, payload: UpdateAdRequest): Observable<Ad> {
    return this.baseApiService
      .put<Ad, UpdateAdRequest>(`${this.endpoint}/${id}`, payload)
      .pipe(map(mapAdDtoToViewModel));
  }

  getAdById(id: string): Observable<Ad> {
    return this.baseApiService.get<Ad>(`${this.endpoint}/${id}`).pipe(map(mapAdDtoToViewModel));
  }

  pauseAd(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/pause`, {});
  }

  activateAd(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/activate`, {});
  }

  getAdInsights(id: string, dateFrom?: string, dateTo?: string): Observable<InsightsResponse> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/${id}/insights`, {
        params: { dateFrom, dateTo },
      })
      .pipe(
        map((response) => normalizeInsightsResponse(response)),
        map(mapInsightsResponseDtoToViewModel),
      );
  }
}
