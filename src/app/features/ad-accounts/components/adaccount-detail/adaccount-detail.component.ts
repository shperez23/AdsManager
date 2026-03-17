import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subject, finalize, forkJoin, takeUntil } from 'rxjs';

import { AdsService } from '../../../../core/api/services/ads.service';
import { AdAccountsService } from '../../../../core/api/services/adaccounts.service';
import { AdSetsService } from '../../../../core/api/services/adsets.service';
import { Ad, AdAccount, AdSet } from '../../../../shared/models';

@Component({
  selector: 'app-adaccount-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adaccount-detail.component.html',
})
export class AdaccountDetailComponent implements OnChanges, OnDestroy {
  @Input() adAccountId: string | null = null;

  adAccount: AdAccount | null = null;
  ads: Ad[] = [];
  adSets: AdSet[] = [];

  isLoading = false;
  errorMessage: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly adAccountsService: AdAccountsService,
    private readonly adsService: AdsService,
    private readonly adSetsService: AdSetsService,
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

    forkJoin({
      adAccounts: this.adAccountsService.getAdAccounts({ Page: 1, PageSize: 100, Search: id }),
      ads: this.adsService.getAds({ Page: 1, PageSize: 10, Search: id }),
      adSets: this.adSetsService.getAdSets({ Page: 1, PageSize: 10, Search: id }),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: ({ adAccounts, ads, adSets }) => {
          this.adAccount = adAccounts.items.find((item) => item.id === id) ?? null;
          this.ads = ads.items;
          this.adSets = adSets.items;
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar el detalle del AdAccount.';
          this.resetState();
        },
      });
  }

  private resetState(): void {
    this.adAccount = null;
    this.ads = [];
    this.adSets = [];
  }
}
