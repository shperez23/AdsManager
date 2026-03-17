import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AdAccount, PaginatedResponse, AdAccountsQueryParams } from '../../../shared/models';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class AdAccountsService {
  private readonly endpoint = 'adaccounts';

  constructor(private readonly baseApiService: BaseApiService) {}

  getAdAccounts(params?: AdAccountsQueryParams): Observable<PaginatedResponse<AdAccount>> {
    return this.baseApiService.get<PaginatedResponse<AdAccount>>(this.endpoint, { params });
  }

  importFromMeta(): Observable<void> {
    return this.baseApiService.post<void, Record<string, never>>(`${this.endpoint}/import-from-meta`, {});
  }

  syncAdAccount(id: string): Observable<void> {
    return this.baseApiService.post<void, Record<string, never>>(`${this.endpoint}/${id}/sync`, {});
  }
}
