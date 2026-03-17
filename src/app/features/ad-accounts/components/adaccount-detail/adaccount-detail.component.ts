import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { Ad, AdAccount, AdSet } from '../../../../shared/models';
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

    this.adAccountsService
      .getAdAccounts({ Page: 1, PageSize: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ items }) => {
          this.adAccount = items.find((item) => item.id === id) ?? null;
          this.ads = [];
          this.adSets = [];
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
