import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateRuleRequest, PaginatedResponse, Rule, UpdateRuleRequest } from '../../../shared/models';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class RulesService {
  private readonly endpoint = 'rules';

  constructor(private readonly baseApiService: BaseApiService) {}

  getRules(): Observable<PaginatedResponse<Rule>> {
    return this.baseApiService.get<PaginatedResponse<Rule>>(this.endpoint);
  }

  createRule(payload: CreateRuleRequest): Observable<Rule> {
    return this.baseApiService.post<Rule, CreateRuleRequest>(this.endpoint, payload);
  }

  updateRule(id: string, payload: UpdateRuleRequest): Observable<Rule> {
    return this.baseApiService.put<Rule, UpdateRuleRequest>(`${this.endpoint}/${id}`, payload);
  }

  activateRule(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/activate`, {});
  }

  deactivateRule(id: string): Observable<void> {
    return this.baseApiService.put<void, Record<string, never>>(`${this.endpoint}/${id}/deactivate`, {});
  }
}
