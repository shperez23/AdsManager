import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Ad,
  CreateAdRequest,
  InsightsResponse,
  PaginatedResponse,
  AdsQueryParams,
  UpdateAdRequest,
} from '../../../shared/models';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class AdsService {
  private readonly endpoint = 'ads';

  constructor(private readonly baseApiService: BaseApiService) {}

  getAds(params?: AdsQueryParams): Observable<PaginatedResponse<Ad>> {
    return this.baseApiService.get<PaginatedResponse<Ad>>(this.endpoint, { params });
  }

  createAd(payload: CreateAdRequest): Observable<Ad> {
    return this.baseApiService.post<Ad, CreateAdRequest>(this.endpoint, payload);
  }

  updateAd(id: string, payload: UpdateAdRequest): Observable<Ad> {
    return this.baseApiService.put<Ad, UpdateAdRequest>(`${this.endpoint}/${id}`, payload);
  }

  getAdById(id: string): Observable<Ad> {
    return this.baseApiService.get<Ad>(`${this.endpoint}/${id}`);
  }

  pauseAd(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/pause`, {});
  }

  activateAd(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/activate`, {});
  }

  getAdInsights(id: string, dateFrom?: string, dateTo?: string): Observable<InsightsResponse> {
    return this.baseApiService.get<InsightsResponse>(`${this.endpoint}/${id}/insights`, {
      params: { dateFrom, dateTo },
    });
  }
}
