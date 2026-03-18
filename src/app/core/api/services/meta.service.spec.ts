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

  it('should remove the act_ prefix when requesting Meta campaigns', () => {
    let receivedCampaigns = 0;

    service.getMetaCampaigns('act_354012118823245').subscribe((campaigns) => {
      receivedCampaigns = campaigns.length;
    });

    const request = httpMock.expectOne(
      'https://localhost:61570/api/v1/meta/ad-accounts/354012118823245/campaigns',
    );

    expect(request.request.method).toBe('GET');
    request.flush([
      { id: 'cmp-1', adAccountId: '354012118823245', name: 'Campaign 1', status: 'ACTIVE' },
    ]);

    expect(receivedCampaigns).toBe(1);
  });

  it('should remove the act_ prefix when creating Meta campaigns', () => {
    const payload = { name: 'Campaign 1', status: 'ACTIVE' };
    let createdCampaignId = '';

    service.createMetaCampaign('act_354012118823245', payload).subscribe((campaign) => {
      createdCampaignId = campaign.id;
    });

    const request = httpMock.expectOne(
      'https://localhost:61570/api/v1/meta/ad-accounts/354012118823245/campaigns',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({
      id: 'cmp-1',
      adAccountId: '354012118823245',
      name: 'Campaign 1',
      status: 'ACTIVE',
    });

    expect(createdCampaignId).toBe('cmp-1');
  });

  it('should send swagger-aligned insights query parameters for Meta ad accounts', () => {
    let receivedRows = 0;

    service
      .getMetaAdAccountInsights('act_354012118823245', '2026-03-01', '2026-03-07', 'campaign')
      .subscribe((response) => {
        receivedRows = response.rows.length;
      });

    const request = httpMock.expectOne(
      'https://localhost:61570/api/v1/meta/ad-accounts/354012118823245/insights?since=2026-03-01&until=2026-03-07&level=campaign',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      rows: [
        { dateStart: '2026-03-01', dateEnd: '2026-03-01', impressions: 10, clicks: 2, spend: 4.5 },
      ],
    });

    expect(receivedRows).toBe(1);
  });

  it('should remove the act_ prefix when creating Meta ad sets', () => {
    const payload = { name: 'Ad Set 1' };
    let createdAdSetId = '';

    service.createMetaAdSet('act_354012118823245', payload).subscribe((adSet) => {
      createdAdSetId = adSet.id;
    });

    const request = httpMock.expectOne(
      'https://localhost:61570/api/v1/meta/ad-accounts/354012118823245/adsets',
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({
      id: 'adset-1',
      adAccountId: '354012118823245',
      name: 'Ad Set 1',
      status: 'ACTIVE',
    });

    expect(createdAdSetId).toBe('adset-1');
  });
});
