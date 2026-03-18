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
import { normalizeInsightsResponse } from '../../../shared/utils/insights.util';
import { mapCampaignsQueryParams } from '../mappers/query-params.mapper';
import {
  mapCampaignDtoToViewModel,
  mapInsightsResponseDtoToViewModel,
  mapPaginatedResponseDtoToViewModel,
} from '../mappers/resource-view-model.mapper';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class CampaignsService {
  private readonly endpoint = 'campaigns';

  constructor(private readonly baseApiService: BaseApiService) {}

  getCampaigns(params?: CampaignsQueryParams): Observable<PaginatedResponse<Campaign>> {
    return this.baseApiService
      .get<PaginatedResponse<Campaign>>(this.endpoint, { params: mapCampaignsQueryParams(params) })
      .pipe(map((response) => mapPaginatedResponseDtoToViewModel(response, mapCampaignDtoToViewModel)));
  }

  createCampaign(payload: CreateCampaignRequest): Observable<Campaign> {
    return this.baseApiService
      .post<Campaign, CreateCampaignRequest>(this.endpoint, payload)
      .pipe(map(mapCampaignDtoToViewModel));
  }

  getCampaignById(id: string): Observable<Campaign> {
    return this.baseApiService.get<Campaign>(`${this.endpoint}/${id}`).pipe(map(mapCampaignDtoToViewModel));
  }

  updateCampaign(id: string, payload: UpdateCampaignRequest): Observable<Campaign> {
    return this.baseApiService
      .put<Campaign, UpdateCampaignRequest>(`${this.endpoint}/${id}`, payload)
      .pipe(map(mapCampaignDtoToViewModel));
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
      .pipe(
        map((response) => normalizeInsightsResponse(response)),
        map(mapInsightsResponseDtoToViewModel),
      );
  }
}
