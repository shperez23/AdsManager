import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';

import { AdAccountsService } from '../../../../core/api/services/adaccounts.service';
import { AdsService } from '../../../../core/api/services/ads.service';
import { AdSetsService } from '../../../../core/api/services/adsets.service';
import { CampaignsService } from '../../../../core/api/services/campaigns.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { Ad, AdAccount, AdSet, Campaign } from '../../../../shared/models';

@Component({
  selector: 'app-adaccount-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adaccount-detail.component.html',
})
export class AdaccountDetailComponent implements OnChanges {
  @Input() adAccountId: string | null = null;

  adAccount: AdAccount | null = null;
  campaigns: Campaign[] = [];
  ads: Ad[] = [];
  adSets: AdSet[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly adAccountsService: AdAccountsService,
    private readonly campaignsService: CampaignsService,
    private readonly adsService: AdsService,
    private readonly adSetsService: AdSetsService,
    private readonly requestFeedbackService: RequestFeedbackService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['adAccountId']) {
      return;
    }

    if (!this.adAccountId) {
      this.resetState();
      return;
    }

    this.loadAdAccountDetail(this.adAccountId);
  }

  trackByCampaign(_: number, campaign: Campaign): string {
    return campaign.id;
  }

  trackByAd(_: number, ad: Ad): string {
    return ad.id;
  }

  trackByAdSet(_: number, adSet: AdSet): string {
    return adSet.id;
  }

  private loadAdAccountDetail(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.adAccountsService
      .getAdAccounts({ Page: 1, PageSize: 100, Search: id })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((adAccountsResponse) => {
          const selectedAdAccount = adAccountsResponse.items.find((item) => item.id === id) ?? null;

          if (!selectedAdAccount) {
            return of({ selectedAdAccount: null, campaigns: [], adSets: [], ads: [] });
          }

          return this.campaignsService.getCampaigns({ Page: 1, PageSize: 100, AdAccountId: id }).pipe(
            switchMap((campaignsResponse) => {
              const campaigns = campaignsResponse.items;

              if (campaigns.length === 0) {
                return of({ selectedAdAccount, campaigns, adSets: [], ads: [] });
              }

              return forkJoin({
                adSets: forkJoin(
                  campaigns.map((campaign) =>
                    this.adSetsService.getAdSets({
                      Page: 1,
                      PageSize: 100,
                      CampaignId: campaign.id,
                    }),
                  ),
                ).pipe(map((responses) => responses.flatMap((response) => response.items))),
                ads: forkJoin(
                  campaigns.map((campaign) =>
                    this.adsService.getAds({
                      Page: 1,
                      PageSize: 100,
                      CampaignId: campaign.id,
                    }),
                  ),
                ).pipe(
                  map((responses) => responses.flatMap((response) => response.items)),
                  map((ads) => Array.from(new Map(ads.map((ad) => [ad.id, ad])).values())),
                ),
              }).pipe(
                map(({ adSets, ads }) => ({
                  selectedAdAccount,
                  campaigns,
                  adSets,
                  ads,
                })),
              );
            }),
          );
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: ({ selectedAdAccount, campaigns, adSets, ads }) => {
          if (!selectedAdAccount) {
            this.resetState();
            this.errorMessage = 'No se encontró el AdAccount solicitado.';
            return;
          }

          this.adAccount = selectedAdAccount;
          this.campaigns = campaigns;
          this.adSets = adSets;
          this.ads = ads;
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudo cargar el detalle del AdAccount.',
          );
          this.resetState();
        },
      });
  }

  private resetState(): void {
    this.adAccount = null;
    this.campaigns = [];
    this.ads = [];
    this.adSets = [];
  }
}
