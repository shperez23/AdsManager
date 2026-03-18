import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  AdAccount,
  CreateMetaConnectionRequest,
  InsightsResponse,
  MetaAd,
  MetaAdCreateRequest,
  MetaAdSet,
  MetaAdSetCreateRequest,
  MetaCampaign,
  MetaCampaignCreateRequest,
  MetaCampaignStatusUpdateRequest,
  MetaConnection,
  MetaConnectionMutationRequest,
  UpdateMetaConnectionRequest,
} from '../../../shared/models';
import { normalizeInsightsResponse } from '../../../shared/utils/insights.util';
import {
  mapAdAccountDtoToViewModel,
  mapMetaAdDtoToViewModel,
  mapMetaAdSetDtoToViewModel,
  mapMetaCampaignDtoToViewModel,
  mapMetaConnectionDtoToViewModel,
} from '../mappers/resource-view-model.mapper';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly endpoint = 'meta';

  constructor(private readonly baseApiService: BaseApiService) {}

  getMetaAdAccounts(): Observable<AdAccount[]> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/ad-accounts`)
      .pipe(map((response) => normalizeCollection(response).map(mapAdAccountDtoToViewModel)));
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

  getMetaCampaigns(adAccountId: string): Observable<MetaCampaign[]> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/ad-accounts/${adAccountId}/campaigns`)
      .pipe(map((response) => normalizeCollection(response).map(mapMetaCampaignDtoToViewModel)));
  }

  createMetaCampaign(
    adAccountId: string,
    payload: MetaCampaignCreateRequest,
  ): Observable<MetaCampaign> {
    return this.baseApiService
      .post<
        unknown,
        MetaCampaignCreateRequest
      >(`${this.endpoint}/ad-accounts/${adAccountId}/campaigns`, payload)
      .pipe(map((response) => mapMetaCampaignDtoToViewModel(normalizeEntity(response))));
  }

  updateMetaCampaignStatus(payload: MetaCampaignStatusUpdateRequest): Observable<void> {
    return this.baseApiService.patch<void, MetaCampaignStatusUpdateRequest>(
      `${this.endpoint}/campaigns/status`,
      payload,
    );
  }

  createMetaAdSet(adAccountId: string, payload: MetaAdSetCreateRequest): Observable<MetaAdSet> {
    return this.baseApiService
      .post<
        unknown,
        MetaAdSetCreateRequest
      >(`${this.endpoint}/ad-accounts/${adAccountId}/adsets`, payload)
      .pipe(map((response) => mapMetaAdSetDtoToViewModel(normalizeEntity(response))));
  }

  createMetaAd(payload: MetaAdCreateRequest): Observable<MetaAd> {
    return this.baseApiService
      .post<unknown, MetaAdCreateRequest>(`${this.endpoint}/ads`, payload)
      .pipe(map((response) => mapMetaAdDtoToViewModel(normalizeEntity(response))));
  }

  getConnections(): Observable<MetaConnection[]> {
    return this.baseApiService
      .get<unknown>(`${this.endpoint}/connections`)
      .pipe(
        map((response) =>
          normalizeMetaConnectionsResponse(response).map(mapMetaConnectionDtoToViewModel),
        ),
      );
  }

  createConnection(payload: CreateMetaConnectionRequest): Observable<MetaConnection> {
    return this.baseApiService
      .post<
        unknown,
        CreateMetaConnectionRequest
      >(`${this.endpoint}/connections`, this.sanitizeConnectionPayload(payload))
      .pipe(
        map((response) =>
          mapMetaConnectionDtoToViewModel(normalizeMetaConnectionResponse(response)),
        ),
      );
  }

  updateConnection(id: string, payload: UpdateMetaConnectionRequest): Observable<MetaConnection> {
    return this.baseApiService
      .put<
        unknown,
        UpdateMetaConnectionRequest
      >(`${this.endpoint}/connections/${id}`, this.sanitizeConnectionPayload(payload))
      .pipe(
        map((response) =>
          mapMetaConnectionDtoToViewModel(normalizeMetaConnectionResponse(response)),
        ),
      );
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

function normalizeCollection(response: unknown): UnknownRecord[] {
  if (Array.isArray(response)) {
    return response.filter(isRecord);
  }

  if (!isRecord(response)) {
    return [];
  }

  const wrappedCollection = ['data', 'result', 'value', 'payload', 'items']
    .map((key) => response[key])
    .find((candidate) => Array.isArray(candidate));

  return Array.isArray(wrappedCollection) ? wrappedCollection.filter(isRecord) : [];
}

function normalizeEntity(response: unknown): UnknownRecord {
  if (!isRecord(response)) {
    return {};
  }

  const wrappedEntity = ['data', 'result', 'value', 'payload']
    .map((key) => response[key])
    .find((candidate) => isRecord(candidate));

  return isRecord(wrappedEntity) ? wrappedEntity : response;
}

function normalizeMetaConnectionsResponse(response: unknown): MetaConnection[] {
  return normalizeCollection(response).map(toMetaConnection);
}

function normalizeMetaConnectionResponse(response: unknown): MetaConnection {
  return toMetaConnection(normalizeEntity(response));
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function toMetaConnection(source: UnknownRecord): MetaConnection {
  return source as unknown as MetaConnection;
}
