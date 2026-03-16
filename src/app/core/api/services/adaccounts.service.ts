import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AdAccount,
  AdAccountsQueryParams,
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
