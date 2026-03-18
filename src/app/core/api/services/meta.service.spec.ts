import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BaseApiService } from './base-api.service';
import { MetaService } from './meta.service';

describe('MetaService', () => {
  let service: MetaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        BaseApiService,
        MetaService,
      ],
    });

    service = TestBed.inject(MetaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send swagger-aligned insights query parameters for Meta ad accounts', () => {
    let receivedRows = 0;

    service
      .getMetaAdAccountInsights('acc-1', '2026-03-01', '2026-03-07', 'campaign')
      .subscribe((response) => {
        receivedRows = response.rows.length;
      });

    const request = httpMock.expectOne(
      'https://localhost:61570/api/v1/meta/ad-accounts/acc-1/insights?since=2026-03-01&until=2026-03-07&level=campaign',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      rows: [{ dateStart: '2026-03-01', dateEnd: '2026-03-01', impressions: 10, clicks: 2, spend: 4.5 }],
    });

    expect(receivedRows).toBe(1);
  });
});
