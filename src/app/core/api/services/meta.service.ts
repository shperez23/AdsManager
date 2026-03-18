import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  AdAccount,
  CreateMetaConnectionRequest,
  InsightsResponse,
  MetaAdCreateRequest,
  MetaAdSetCreateRequest,
  MetaCampaignCreateRequest,
  MetaCampaignStatusUpdateRequest,
  MetaConnection,
  MetaConnectionMutationRequest,
  UpdateMetaConnectionRequest,
} from '../../../shared/models';
import { normalizeInsightsResponse } from '../../../shared/utils/insights.util';
import { mapMetaConnectionDtoToViewModel } from '../mappers/resource-view-model.mapper';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly endpoint = 'meta';

  constructor(private readonly baseApiService: BaseApiService) {}

  getMetaAdAccounts(): Observable<AdAccount[]> {
    return this.baseApiService.get<AdAccount[]>(`${this.endpoint}/ad-accounts`);
  }

  getMetaAdAccountInsights(
    adAccountId: string,
    dateFrom?: string,
    dateTo?: string,
    level?: string,
  ): Observable<InsightsResponse> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/ad-accounts/${adAccountId}/insights`, {
        params: { since: dateFrom, until: dateTo, level },
      })
      .pipe(map((response) => normalizeInsightsResponse(response)));
  }

  getMetaCampaigns(adAccountId: string): Observable<unknown[]> {
    return this.baseApiService.get<unknown[]>(
      `${this.endpoint}/ad-accounts/${adAccountId}/campaigns`,
    );
  }

  createMetaCampaign(adAccountId: string, payload: MetaCampaignCreateRequest): Observable<unknown> {
    return this.baseApiService.post<unknown, MetaCampaignCreateRequest>(
      `${this.endpoint}/ad-accounts/${adAccountId}/campaigns`,
      payload,
    );
  }

  updateMetaCampaignStatus(payload: MetaCampaignStatusUpdateRequest): Observable<void> {
    return this.baseApiService.patch<void, MetaCampaignStatusUpdateRequest>(
      `${this.endpoint}/campaigns/status`,
      payload,
    );
  }

  createMetaAdSet(adAccountId: string, payload: MetaAdSetCreateRequest): Observable<unknown> {
    return this.baseApiService.post<unknown, MetaAdSetCreateRequest>(
      `${this.endpoint}/ad-accounts/${adAccountId}/adsets`,
      payload,
    );
  }

  createMetaAd(payload: MetaAdCreateRequest): Observable<unknown> {
    return this.baseApiService.post<unknown, MetaAdCreateRequest>(`${this.endpoint}/ads`, payload);
  }

  getConnections(): Observable<MetaConnection[]> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/connections`)
      .pipe(map((response) => normalizeMetaConnectionsResponse(response).map(mapMetaConnectionDtoToViewModel)));
  }

  createConnection(payload: CreateMetaConnectionRequest): Observable<MetaConnection> {
    return this.baseApiService
      .post<
        unknown,
        CreateMetaConnectionRequest
      >(`${this.endpoint}/connections`, this.sanitizeConnectionPayload(payload))
      .pipe(map((response) => mapMetaConnectionDtoToViewModel(normalizeMetaConnectionResponse(response))));
  }

  updateConnection(id: string, payload: UpdateMetaConnectionRequest): Observable<MetaConnection> {
    return this.baseApiService
      .put<
        unknown,
        UpdateMetaConnectionRequest
      >(`${this.endpoint}/connections/${id}`, this.sanitizeConnectionPayload(payload))
      .pipe(map((response) => mapMetaConnectionDtoToViewModel(normalizeMetaConnectionResponse(response))));
  }

  deleteConnection(id: string): Observable<void> {
    return this.baseApiService.delete<void>(`${this.endpoint}/connections/${id}`);
  }

  refreshConnectionToken(id: string): Observable<void> {
    return this.baseApiService.post<void, Record<string, never>>(
      `${this.endpoint}/connections/${id}/refresh-token`,
      {},
    );
  }

  validateConnection(id: string): Observable<void> {
    return this.baseApiService.post<void, Record<string, never>>(
      `${this.endpoint}/connections/${id}/validate`,
      {},
    );
  }

  private sanitizeConnectionPayload<T extends MetaConnectionMutationRequest>(payload: T): T {
    return Object.entries(payload).reduce((sanitizedPayload, [key, value]) => {
      if (value !== undefined) {
        sanitizedPayload[key as keyof T] = value as T[keyof T];
      }

      return sanitizedPayload;
    }, {} as T);
  }
}

type UnknownRecord = Record<string, unknown>;

function normalizeMetaConnectionsResponse(response: unknown): MetaConnection[] {
  if (Array.isArray(response)) {
    return response.filter(isRecord).map(toMetaConnection);
  }

  if (!isRecord(response)) {
    return [];
  }

  const wrappedCollection = ['data', 'result', 'value', 'payload', 'items']
    .map((key) => response[key])
    .find((candidate) => Array.isArray(candidate));

  return Array.isArray(wrappedCollection)
    ? wrappedCollection.filter(isRecord).map(toMetaConnection)
    : [];
}

function normalizeMetaConnectionResponse(response: unknown): MetaConnection {
  if (isRecord(response)) {
    const wrappedConnection = ['data', 'result', 'value', 'payload']
      .map((key) => response[key])
      .find((candidate) => isRecord(candidate));

    return isRecord(wrappedConnection) ? toMetaConnection(wrappedConnection) : toMetaConnection(response);
  }

  return { id: '' };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function toMetaConnection(source: UnknownRecord): MetaConnection {
  return source as unknown as MetaConnection;
}
