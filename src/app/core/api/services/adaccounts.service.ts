import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Ad,
  AdAccount,
  AdAccountsQueryParams,
  AdSet,
  ImportFromMetaRequest,
  ImportFromMetaResponse,
  PaginationResponse,
  SyncAdAccountResponse,
} from '../models';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class AdAccountsService {
  private readonly endpoint = 'adaccounts';

  constructor(private readonly baseApiService: BaseApiService) {}

  getAdAccounts(params?: AdAccountsQueryParams): Observable<PaginationResponse<AdAccount>> {
    return this.baseApiService.get<PaginationResponse<AdAccount>>(this.endpoint, {
      params: {
        Status: params?.status,
        Page: params?.page,
        PageSize: params?.pageSize,
        Search: params?.search,
        SortBy: params?.sortBy,
        SortDirection: params?.sortDirection,
      },
    });
  }

  getAdAccountById(id: string): Observable<AdAccount> {
    return this.baseApiService.get<AdAccount>(`${this.endpoint}/${id}`);
  }

  getAdAccountAds(id: string): Observable<PaginationResponse<Ad>> {
    return this.baseApiService.get<PaginationResponse<Ad>>(`${this.endpoint}/${id}/ads`);
  }

  getAdAccountAdSets(id: string): Observable<PaginationResponse<AdSet>> {
    return this.baseApiService.get<PaginationResponse<AdSet>>(`${this.endpoint}/${id}/adsets`);
  }

  importFromMeta(payload: ImportFromMetaRequest = {}): Observable<ImportFromMetaResponse> {
    return this.baseApiService.post<ImportFromMetaResponse, ImportFromMetaRequest>(
      `${this.endpoint}/import-from-meta`,
      payload,
    );
  }

  syncAdAccount(id: string): Observable<SyncAdAccountResponse> {
    return this.baseApiService.post<SyncAdAccountResponse, Record<string, never>>(
      `${this.endpoint}/${id}/sync`,
      {},
    );
  }
}
