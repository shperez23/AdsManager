import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AdAccount, AdAccountsQueryParams, PaginatedResponse } from '../../../shared/models';
import { mapAdAccountsQueryParams } from '../mappers/query-params.mapper';
import {
  mapAdAccountDtoToViewModel,
  mapPaginatedResponseDtoToViewModel,
} from '../mappers/resource-view-model.mapper';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class AdAccountsService {
  private readonly endpoint = 'adaccounts';

  constructor(private readonly baseApiService: BaseApiService) {}

  getAdAccounts(params?: AdAccountsQueryParams): Observable<PaginatedResponse<AdAccount>> {
    return this.baseApiService
      .get<PaginatedResponse<AdAccount>>(this.endpoint, { params: mapAdAccountsQueryParams(params) })
      .pipe(map((response) => mapPaginatedResponseDtoToViewModel(response, mapAdAccountDtoToViewModel)));
  }

  importFromMeta(): Observable<void> {
    return this.baseApiService.post<void, Record<string, never>>(`${this.endpoint}/import-from-meta`, {});
  }

  syncAdAccount(id: string): Observable<void> {
    return this.baseApiService.post<void, Record<string, never>>(`${this.endpoint}/${id}/sync`, {});
  }
}
