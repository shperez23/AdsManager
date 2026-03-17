import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AdSet,
  CreateAdSetRequest,
  InsightsResponse,
  PaginationResponse,
  UpdateAdSetRequest,
} from '../models';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class AdSetsService {
  private readonly endpoint = 'adsets';

  constructor(private readonly baseApiService: BaseApiService) {}

  getAdSets(): Observable<PaginationResponse<AdSet>> {
    return this.baseApiService.get<PaginationResponse<AdSet>>(this.endpoint);
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

  pauseAdSet(id: string): Observable<AdSet> {
    return this.baseApiService.put<AdSet, Record<string, never>>(`${this.endpoint}/${id}/pause`, {});
  }

  activateAdSet(id: string): Observable<AdSet> {
    return this.baseApiService.put<AdSet, Record<string, never>>(`${this.endpoint}/${id}/activate`, {});
  }

  getAdSetInsights(id: string, startDate?: string, endDate?: string): Observable<InsightsResponse> {
    return this.baseApiService.get<InsightsResponse>(`${this.endpoint}/${id}/insights`, {
      params: {
        startDate,
        endDate,
      },
    });
  }
}
