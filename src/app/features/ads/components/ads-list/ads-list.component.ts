import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, finalize, takeUntil } from 'rxjs';

import { AdInsightsDashboardComponent } from '../ad-insights-dashboard/ad-insights-dashboard.component';
import { Ad, PaginationResponse } from '../../../../core/api/models';
import { AdsService } from '../../../../core/api/services/ads.service';

type AdStatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'DISABLED';

@Component({
  selector: 'app-ads-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, AdInsightsDashboardComponent],
  templateUrl: './ads-list.component.html',
})
export class AdsListComponent implements OnInit, OnDestroy {
  readonly pageSizeOptions = [5, 10, 20, 50];
  readonly statusOptions: AdStatusFilter[] = ['ALL', 'ACTIVE', 'PAUSED', 'DISABLED'];

  ads: Ad[] = [];
  filteredAds: Ad[] = [];
  paginatedAds: Ad[] = [];

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
    this.applyFilters();
  }

  onPageSizeChange(pageSize: number): void {
    this.selectedPageSize = Number(pageSize);
    this.currentPage = 1;
    this.updatePagination();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.updatePagination();
  }

  onSelectInsights(adId: string): void {
    this.selectedAdId = adId;
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

  formatCampaign(ad: Ad): string {
    return ad.adSetId || '—';
  }

  formatSpend(ad: Ad): number {
    return ad.budget ?? 0;
  }

  private listenToSearch(): void {
    this.searchChange$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.applyFilters();
      });
  }

  private loadAds(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.adsService
      .getAds()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response: PaginationResponse<Ad>) => {
          this.ads = response.items;
          this.applyFilters();
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar los anuncios.';
          this.ads = [];
          this.filteredAds = [];
          this.paginatedAds = [];
          this.totalItems = 0;
          this.totalPages = 1;
        },
      });
  }

  private applyFilters(): void {
    const normalizedTerm = this.searchTerm.trim().toLowerCase();

    this.filteredAds = this.ads.filter((ad) => {
      const matchesStatus = this.selectedStatus === 'ALL' || ad.status === this.selectedStatus;
      const matchesSearch =
        normalizedTerm.length === 0 ||
        ad.name.toLowerCase().includes(normalizedTerm) ||
        this.formatCampaign(ad).toLowerCase().includes(normalizedTerm);

      return matchesStatus && matchesSearch;
    });

    this.totalItems = this.filteredAds.length;
    this.totalPages = Math.max(Math.ceil(this.totalItems / this.selectedPageSize), 1);

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.updatePagination();
  }

  private updatePagination(): void {
    const start = (this.currentPage - 1) * this.selectedPageSize;
    const end = start + this.selectedPageSize;
    this.paginatedAds = this.filteredAds.slice(start, end);
    this.totalPages = Math.max(Math.ceil(this.totalItems / this.selectedPageSize), 1);
  }
}
