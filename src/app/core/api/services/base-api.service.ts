import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { getApiBaseUrl } from '../../config/api-config';
import { normalizeApiError } from '../utils/api-error.util';

export type QueryParamValue = string | number | boolean | ReadonlyArray<string | number | boolean>;

export interface BaseApiRequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: object;
}

@Injectable({
  providedIn: 'root',
})
export class BaseApiService {
  constructor(private readonly http: HttpClient) {}

  get<T>(endpoint: string, options?: BaseApiRequestOptions): Observable<T> {
    return this.http
      .get<T>(this.buildUrl(endpoint), {
        headers: options?.headers,
        params: this.buildParams(options?.params),
      })
      .pipe(catchError((error: unknown) => this.handleError(error)));
  }

  post<TResponse, TPayload = unknown>(
    endpoint: string,
    payload: TPayload,
    options?: BaseApiRequestOptions,
  ): Observable<TResponse> {
    return this.http
      .post<TResponse>(this.buildUrl(endpoint), payload, {
        headers: options?.headers,
        params: this.buildParams(options?.params),
      })
      .pipe(catchError((error: unknown) => this.handleError(error)));
  }

  put<TResponse, TPayload = unknown>(
    endpoint: string,
    payload: TPayload,
    options?: BaseApiRequestOptions,
  ): Observable<TResponse> {
    return this.http
      .put<TResponse>(this.buildUrl(endpoint), payload, {
        headers: options?.headers,
        params: this.buildParams(options?.params),
      })
      .pipe(catchError((error: unknown) => this.handleError(error)));
  }

  patch<TResponse, TPayload = unknown>(
    endpoint: string,
    payload: TPayload,
    options?: BaseApiRequestOptions,
  ): Observable<TResponse> {
    return this.http
      .patch<TResponse>(this.buildUrl(endpoint), payload, {
        headers: options?.headers,
        params: this.buildParams(options?.params),
      })
      .pipe(catchError((error: unknown) => this.handleError(error)));
  }

  delete<T>(endpoint: string, options?: BaseApiRequestOptions): Observable<T> {
    return this.http
      .delete<T>(this.buildUrl(endpoint), {
        headers: options?.headers,
        params: this.buildParams(options?.params),
      })
      .pipe(catchError((error: unknown) => this.handleError(error)));
  }

  private buildUrl(endpoint: string): string {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${getApiBaseUrl()}/${normalizedEndpoint}`;
  }

  private buildParams(params?: BaseApiRequestOptions['params']): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();

    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
            httpParams = httpParams.append(key, String(item));
          }
        });
        return;
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => normalizeApiError(error));
  }
}
