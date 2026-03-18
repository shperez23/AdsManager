import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { DashboardQueryParams, DashboardSummary } from '../../../shared/models';
import { normalizeDashboardSummary } from '../../../shared/utils/dashboard.util';
import { mapDashboardQueryParams } from '../mappers/query-params.mapper';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly baseApiService: BaseApiService) {}

  getDashboard(params?: DashboardQueryParams): Observable<DashboardSummary> {
    const queryParams = mapDashboardQueryParams(params);

    return this.baseApiService.get<unknown>('dashboard', { params: queryParams }).pipe(
      map((response) => normalizeDashboardSummary(response)),
      catchError((error) => {
        if (!shouldFallbackToReportsDashboard(error)) {
          return throwError(() => error);
        }

        return this.baseApiService.get<unknown>('reports/dashboard', { params: queryParams }).pipe(
          map((response) => normalizeDashboardSummary(response)),
        );
      }),
    );
  }
}

function shouldFallbackToReportsDashboard(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const source = error as {
    status?: number;
    message?: string;
    details?: unknown;
  };

  if (source.status !== 500) {
    return false;
  }

  const detail = readString(source.details, 'detail', 'Detail');
  const message = typeof source.message === 'string' ? source.message : undefined;
  const combinedMessage = `${message ?? ''} ${detail ?? ''}`.toLowerCase();

  return combinedMessage.includes('could not be translated') || combinedMessage.includes('linq expression');
}

function readString(source: unknown, ...keys: string[]): string | undefined {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}
