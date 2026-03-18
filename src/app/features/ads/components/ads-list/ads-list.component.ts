import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, finalize, Subject } from 'rxjs';

import { AdsService } from '../../../../core/api/services/ads.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { Ad, AdsQueryParams, PaginatedResponse, SortDirection } from '../../../../shared/models';
import { EmptyStateComponent } from '../../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';
import { AdInsightsDashboardComponent } from '../ad-insights-dashboard/ad-insights-dashboard.component';

type AdStatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'DISABLED';
type AdSortField = '' | 'name' | 'status' | 'campaignId' | 'adSetId' | 'createdAt' | 'updatedAt';
type AdSortDirectionOption = '' | 'ASC' | 'DESC';

@Component({
  selector: 'app-ads-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdInsightsDashboardComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './ads-list.component.html',
})
export class AdsListComponent implements OnInit, OnChanges {
  @Input() reloadKey = 0;
  @Output() editAd = new EventEmitter<Ad>();

  readonly pageSizeOptions = [5, 10, 20, 50];
  readonly statusOptions: AdStatusFilter[] = ['ALL', 'ACTIVE', 'PAUSED', 'DISABLED'];
  readonly sortFieldOptions: { value: AdSortField; label: string }[] = [
    { value: '', label: 'Sin orden' },
    { value: 'name', label: 'Nombre' },
    { value: 'status', label: 'Estado' },
    { value: 'campaignId', label: 'Campaign ID' },
    { value: 'adSetId', label: 'Ad Set ID' },
    { value: 'createdAt', label: 'Fecha de creación' },
    { value: 'updatedAt', label: 'Fecha de actualización' },
  ];
  readonly sortDirectionOptions: { value: AdSortDirectionOption; label: string }[] = [
    { value: '', label: 'Dirección' },
    { value: 'ASC', label: 'Ascendente' },
    { value: 'DESC', label: 'Descendente' },
  ];

  ads: Ad[] = [];
  searchTerm = '';
  campaignIdFilter = '';
  selectedStatus: AdStatusFilter = 'ALL';
  selectedSortBy: AdSortField = '';
  selectedSortDirection: AdSortDirectionOption = '';
  selectedPageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  selectedAdId: string | null = null;
  isLoading = false;
  actionAdId: string | null = null;
  errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChange$ = new Subject<string>();
  private readonly campaignIdChange$ = new Subject<string>();

  constructor(
    private readonly adsService: AdsService,
    private readonly requestFeedbackService: RequestFeedbackService,
  ) {}

  ngOnInit(): void {
    this.listenToSearch();
    this.listenToCampaignId();
    this.loadAds();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reloadKey'] && !changes['reloadKey'].firstChange) {
      this.loadAds();
    }
  }

  onSearchChange(value: string): void {
    this.searchChange$.next(value);
  }

  onCampaignIdChange(value: string): void {
    this.campaignIdChange$.next(value);
  }

  onStatusChange(status: AdStatusFilter): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadAds();
  }

  onSortByChange(sortBy: AdSortField): void {
    this.selectedSortBy = sortBy;
    if (!sortBy) {
      this.selectedSortDirection = '';
    }
    this.currentPage = 1;
    this.loadAds();
  }

  onSortDirectionChange(sortDirection: AdSortDirectionOption): void {
    this.selectedSortDirection = sortDirection;
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
    this.actionAdId = ad.id;

    const request$ = ad.status === 'ACTIVE' ? this.adsService.pauseAd(ad.id) : this.adsService.activateAd(ad.id);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.actionAdId = null;
        }),
      )
      .subscribe({
        next: () => this.loadAds(),
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudo actualizar el estado del anuncio.',
          );
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
    this.searchChange$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe((term) => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.loadAds();
    });
  }

  private listenToCampaignId(): void {
    this.campaignIdChange$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((campaignId) => {
        this.campaignIdFilter = campaignId;
        this.currentPage = 1;
        this.loadAds();
      });
  }

  private loadAds(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const params: AdsQueryParams = {
      Page: this.currentPage,
      PageSize: this.selectedPageSize,
      Search: this.searchTerm || undefined,
      Status: this.selectedStatus !== 'ALL' ? this.selectedStatus : undefined,
      CampaignId: this.campaignIdFilter.trim() || undefined,
      SortBy: this.selectedSortBy || undefined,
      SortDirection: this.toSortDirection(this.selectedSortDirection),
    };

    this.adsService
      .getAds(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
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
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudieron cargar los anuncios.',
          );
          this.ads = [];
          this.totalItems = 0;
          this.totalPages = 1;
        },
      });
  }

  private toSortDirection(sortDirection: AdSortDirectionOption): SortDirection | undefined {
    if (sortDirection === 'ASC') {
      return SortDirection.Asc;
    }

    if (sortDirection === 'DESC') {
      return SortDirection.Desc;
    }

    return undefined;
  }
}
