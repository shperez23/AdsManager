import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  CreateRuleRequest,
  PaginatedResponse,
  Rule,
  RulesQueryParams,
  UpdateRuleRequest,
} from '../../../shared/models';
import { mapRulesQueryParams } from '../mappers/query-params.mapper';
import {
  mapPaginatedResponseDtoToViewModel,
  mapRuleDtoToViewModel,
} from '../mappers/resource-view-model.mapper';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class RulesService {
  private readonly endpoint = 'rules';

  constructor(private readonly baseApiService: BaseApiService) {}

  getRules(params?: RulesQueryParams): Observable<PaginatedResponse<Rule>> {
    return this.baseApiService
      .get<PaginatedResponse<Rule>>(this.endpoint, { params: mapRulesQueryParams(params) })
      .pipe(map((response) => mapPaginatedResponseDtoToViewModel(response, mapRuleDtoToViewModel)));
  }

  createRule(payload: CreateRuleRequest): Observable<Rule> {
    return this.baseApiService
      .post<Rule, CreateRuleRequest>(this.endpoint, payload)
      .pipe(map(mapRuleDtoToViewModel));
  }

  updateRule(id: string, payload: UpdateRuleRequest): Observable<Rule> {
    return this.baseApiService
      .put<Rule, UpdateRuleRequest>(`${this.endpoint}/${id}`, payload)
      .pipe(map(mapRuleDtoToViewModel));
  }

  activateRule(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/activate`, {});
  }

  deactivateRule(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/deactivate`, {});
  }
}
