import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Ad,
  CreateAdRequest,
  InsightsResponse,
  PaginationResponse,
  UpdateAdRequest,
} from '../models';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class AdsService {
  private readonly endpoint = 'ads';

  constructor(private readonly baseApiService: BaseApiService) {}

  getAds(): Observable<PaginationResponse<Ad>> {
    return this.baseApiService.get<PaginationResponse<Ad>>(this.endpoint);
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

  pauseAd(id: string): Observable<Ad> {
    return this.baseApiService.put<Ad, Record<string, never>>(`${this.endpoint}/${id}/pause`, {});
  }

  activateAd(id: string): Observable<Ad> {
    return this.baseApiService.put<Ad, Record<string, never>>(`${this.endpoint}/${id}/activate`, {});
  }

  getAdInsights(id: string, startDate?: string, endDate?: string): Observable<InsightsResponse> {
    return this.baseApiService.get<InsightsResponse>(`${this.endpoint}/${id}/insights`, {
      params: {
        startDate,
        endDate,
      },
    });
  }
}
