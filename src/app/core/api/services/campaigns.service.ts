import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  Campaign,
  CampaignsQueryParams,
  CreateCampaignRequest,
  InsightsResponse,
  PaginatedResponse,
  UpdateCampaignRequest,
} from '../../../shared/models';
import { BaseApiService } from './base-api.service';
import { normalizeInsightsResponse } from '../../../shared/utils/insights.util';

@Injectable({ providedIn: 'root' })
export class CampaignsService {
  private readonly endpoint = 'campaigns';

  constructor(private readonly baseApiService: BaseApiService) {}

  getCampaigns(params?: CampaignsQueryParams): Observable<PaginatedResponse<Campaign>> {
    return this.baseApiService.get<PaginatedResponse<Campaign>>(this.endpoint, { params });
  }

  createCampaign(payload: CreateCampaignRequest): Observable<Campaign> {
    return this.baseApiService.post<Campaign, CreateCampaignRequest>(this.endpoint, payload);
  }

  getCampaignById(id: string): Observable<Campaign> {
    return this.baseApiService.get<Campaign>(`${this.endpoint}/${id}`);
  }

  updateCampaign(id: string, payload: UpdateCampaignRequest): Observable<Campaign> {
    return this.baseApiService.put<Campaign, UpdateCampaignRequest>(`${this.endpoint}/${id}`, payload);
  }

  pauseCampaign(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/pause`, {});
  }

  activateCampaign(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/activate`, {});
  }

  getCampaignInsights(id: string, dateFrom?: string, dateTo?: string): Observable<InsightsResponse> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/${id}/insights`, {
        params: { dateFrom, dateTo },
      })
      .pipe(map((response) => normalizeInsightsResponse(response)));
  }
}
