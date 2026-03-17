import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, finalize, takeUntil } from 'rxjs';

import { AdInsightsDashboardComponent } from '../ad-insights-dashboard/ad-insights-dashboard.component';
import { Ad, PaginatedResponse, PaginationQueryParams } from '../../../../shared/models';
import { AdsService } from '../../../../core/api/services/ads.service';
import { EmptyStateComponent } from '../../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';

type AdStatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'DISABLED';

@Component({
  selector: 'app-ads-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    AdInsightsDashboardComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './ads-list.component.html',
})
export class AdsListComponent implements OnInit, OnDestroy {
  @Output() editAd = new EventEmitter<Ad>();

  readonly pageSizeOptions = [5, 10, 20, 50];
  readonly statusOptions: AdStatusFilter[] = ['ALL', 'ACTIVE', 'PAUSED', 'DISABLED'];

  ads: Ad[] = [];

  searchTerm = '';
  selectedStatus: AdStatusFilter = 'ALL';
  selectedPageSize = 10;

  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  selectedAdId: string | null = null;

  isLoading = false;
  errorMessage: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly searchChange$ = new Subject<string>();

  constructor(private readonly adsService: AdsService) {}

  ngOnInit(): void {
    this.listenToSearch();
    this.loadAds();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchChange$.next(value);
  }

  onStatusChange(status: AdStatusFilter): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadAds();
  }

  onPageSizeChange(pageSize: number): void {
    this.selectedPageSize = Number(pageSize);
    this.currentPage = 1;
    this.loadAds();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadAds();
  }

  onSelectInsights(adId: string): void {
    this.selectedAdId = adId;
  }

  onEdit(ad: Ad): void {
    this.editAd.emit(ad);
  }

  onToggleStatus(ad: Ad): void {
    const request$ = ad.status === 'ACTIVE' ? this.adsService.pauseAd(ad.id) : this.adsService.activateAd(ad.id);

    this.isLoading = true;
    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: () => this.loadAds(),
        error: () => {
          this.errorMessage = 'No se pudo actualizar el estado del anuncio.';
        },
      });
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  trackByAd(_: number, ad: Ad): string {
    return ad.id;
  }

  onRetry(): void {
    this.loadAds();
  }

  private listenToSearch(): void {
    this.searchChange$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.loadAds();
      });
  }

  private loadAds(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const params: PaginationQueryParams = {
      Page: this.currentPage,
      PageSize: this.selectedPageSize,
      Search: this.searchTerm || undefined,
      Status: this.selectedStatus !== 'ALL' ? this.selectedStatus : undefined,
    };

    this.adsService
      .getAds(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response: PaginatedResponse<Ad>) => {
          this.ads = response.items;
          this.totalItems = response.totalItems;
          this.totalPages = Math.max(response.totalPages, 1);
          this.currentPage = response.page;
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar los anuncios.';
          this.ads = [];
          this.totalItems = 0;
          this.totalPages = 1;
        },
      });
  }
}
