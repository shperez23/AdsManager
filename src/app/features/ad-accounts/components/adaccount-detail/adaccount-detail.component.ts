import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import { Ad, AdAccount, AdSet } from '../../../../core/api/models';
import { AdAccountsService } from '../../../../core/api/services/adaccounts.service';

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

  constructor(private readonly adAccountsService: AdAccountsService) {}

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
      adAccount: this.adAccountsService.getAdAccountById(id),
      adsResponse: this.adAccountsService.getAdAccountAds(id),
      adSetsResponse: this.adAccountsService.getAdAccountAdSets(id),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ adAccount, adsResponse, adSetsResponse }) => {
          this.adAccount = adAccount;
          this.ads = adsResponse.items;
          this.adSets = adSetsResponse.items;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar el detalle del AdAccount.';
          this.resetState();
          this.isLoading = false;
        },
      });
  }

  private resetState(): void {
    this.adAccount = null;
    this.ads = [];
    this.adSets = [];
  }
}
