import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AdAccount,
  CreateMetaConnectionRequest,
  InsightsResponse,
  MetaAdCreateRequest,
  MetaAdSetCreateRequest,
  MetaCampaignCreateRequest,
  MetaCampaignStatusUpdateRequest,
  MetaConnection,
  UpdateMetaConnectionRequest,
} from '../../../shared/models';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly endpoint = 'meta';

  constructor(private readonly baseApiService: BaseApiService) {}

  getMetaAdAccounts(): Observable<AdAccount[]> {
    return this.baseApiService.get<AdAccount[]>(`${this.endpoint}/ad-accounts`);
  }

  getMetaAdAccountInsights(adAccountId: string, dateFrom?: string, dateTo?: string): Observable<InsightsResponse> {
    return this.baseApiService.get<InsightsResponse>(`${this.endpoint}/ad-accounts/${adAccountId}/insights`, {
      params: { dateFrom, dateTo },
    });
  }

  getMetaCampaigns(adAccountId: string): Observable<unknown[]> {
    return this.baseApiService.get<unknown[]>(`${this.endpoint}/ad-accounts/${adAccountId}/campaigns`);
  }

  createMetaCampaign(adAccountId: string, payload: MetaCampaignCreateRequest): Observable<unknown> {
    return this.baseApiService.post<unknown, MetaCampaignCreateRequest>(
      `${this.endpoint}/ad-accounts/${adAccountId}/campaigns`,
      payload,
    );
  }

  updateMetaCampaignStatus(payload: MetaCampaignStatusUpdateRequest): Observable<void> {
    return this.baseApiService.patch<void, MetaCampaignStatusUpdateRequest>(`${this.endpoint}/campaigns/status`, payload);
  }

  createMetaAdSet(adAccountId: string, payload: MetaAdSetCreateRequest): Observable<unknown> {
    return this.baseApiService.post<unknown, MetaAdSetCreateRequest>(`${this.endpoint}/ad-accounts/${adAccountId}/adsets`, payload);
  }

  createMetaAd(payload: MetaAdCreateRequest): Observable<unknown> {
    return this.baseApiService.post<unknown, MetaAdCreateRequest>(`${this.endpoint}/ads`, payload);
  }

  getConnections(): Observable<MetaConnection[]> {
    return this.baseApiService.get<MetaConnection[]>(`${this.endpoint}/connections`);
  }

  createConnection(payload: CreateMetaConnectionRequest): Observable<MetaConnection> {
    return this.baseApiService.post<MetaConnection, CreateMetaConnectionRequest>(`${this.endpoint}/connections`, payload);
  }

  updateConnection(id: string, payload: UpdateMetaConnectionRequest): Observable<MetaConnection> {
    return this.baseApiService.put<MetaConnection, UpdateMetaConnectionRequest>(`${this.endpoint}/connections/${id}`, payload);
  }

  deleteConnection(id: string): Observable<void> {
    return this.baseApiService.delete<void>(`${this.endpoint}/connections/${id}`);
  }

  refreshConnectionToken(id: string): Observable<void> {
    return this.baseApiService.post<void, Record<string, never>>(`${this.endpoint}/connections/${id}/refresh-token`, {});
  }

  validateConnection(id: string): Observable<void> {
    return this.baseApiService.post<void, Record<string, never>>(`${this.endpoint}/connections/${id}/validate`, {});
  }
}
