import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { API_BASE_URL } from '../../config/api-config';

export type QueryParamValue = string | number | boolean | ReadonlyArray<string | number | boolean>;

export interface BaseApiRequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: Record<string, QueryParamValue | null | undefined>;
}

@Injectable({
  providedIn: 'root',
})
export class BaseApiService {
  private readonly baseUrl = API_BASE_URL;

  constructor(private readonly http: HttpClient) {}

  get<T>(endpoint: string, options?: BaseApiRequestOptions): Observable<T> {
    return this.http
      .get<T>(this.buildUrl(endpoint), {
        headers: options?.headers,
        params: this.buildParams(options?.params),
      })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
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
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
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
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  delete<T>(endpoint: string, options?: BaseApiRequestOptions): Observable<T> {
    return this.http
      .delete<T>(this.buildUrl(endpoint), {
        headers: options?.headers,
        params: this.buildParams(options?.params),
      })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  private buildUrl(endpoint: string): string {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${normalizedEndpoint}`;
  }

  private buildParams(params?: BaseApiRequestOptions['params']): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          httpParams = httpParams.append(key, String(item));
        });
        return;
      }

      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const apiError = {
      status: error.status,
      message: error.error?.message ?? error.message ?? 'Unexpected API error',
      details: error.error,
      url: error.url ?? undefined,
    };

    return throwError(() => apiError);
  }
}
