import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdAccountsService } from '../../../core/api/services/adaccounts.service';
import { CampaignsService } from '../../../core/api/services/campaigns.service';
import { ReportsService } from '../../../core/api/services/reports.service';
import { RequestFeedbackService } from '../../../core/errors/request-feedback.service';
import {
  AdAccount,
  Campaign,
  CampaignsQueryParams,
  InsightMetrics,
  InsightsReportQueryParams,
  InsightsReportResponse,
  PaginatedResponse,
  SortDirection,
} from '../../../shared/models';
import { EmptyStateComponent } from '../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../shared/ui/states/loading-state.component';
import { createDefaultDateRange } from '../../../shared/utils/insights.util';
import { ReportsDashboardSectionComponent } from '../components/reports-dashboard-section/reports-dashboard-section.component';

type ReportSortColumn = 'dateStart' | 'impressions' | 'clicks' | 'spend' | 'ctr' | 'cpc' | 'cpm';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    PercentPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    ReportsDashboardSectionComponent,
  ],
  templateUrl: './reports-page.component.html',
})
export class ReportsPageComponent implements OnInit {
  readonly today = createDefaultDateRange(0).dateTo;
  readonly pageSizeOptions = [10, 20, 50, 100];
  readonly sortOptions: Array<{ value: ReportSortColumn; label: string }> = [
    { value: 'dateStart', label: 'Fecha inicial' },
    { value: 'impressions', label: 'Impresiones' },
    { value: 'clicks', label: 'Clics' },
    { value: 'spend', label: 'Gasto' },
    { value: 'ctr', label: 'CTR' },
    { value: 'cpc', label: 'CPC' },
    { value: 'cpm', label: 'CPM' },
  ];
  readonly sortDirectionOptions = [
    { value: SortDirection.Desc, label: 'Descendente' },
    { value: SortDirection.Asc, label: 'Ascendente' },
  ];
  readonly exportSupported = false;

  dateFrom = createDefaultDateRange(30).dateFrom;
  dateTo = createDefaultDateRange(30).dateTo;
  search = '';
  selectedAdAccountId = '';
  selectedCampaignId = '';
  page = 1;
  pageSize = 20;
  sortBy: ReportSortColumn = 'dateStart';
  sortDirection: SortDirection = SortDirection.Desc;

  adAccounts: AdAccount[] = [];
  campaigns: Campaign[] = [];
  report: InsightsReportResponse = this.createEmptyReport();

  isLoadingFilters = false;
  isLoadingReport = false;
  errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly reportsService: ReportsService,
    private readonly adAccountsService: AdAccountsService,
    private readonly campaignsService: CampaignsService,
    private readonly requestFeedbackService: RequestFeedbackService,
  ) {}

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadReport();
  }

  get rows(): InsightMetrics[] {
    return this.report.rows ?? [];
  }

  get totalSpend(): number {
    return this.rows.reduce((total, row) => total + row.spend, 0);
  }

  get totalImpressions(): number {
    return this.rows.reduce((total, row) => total + row.impressions, 0);
  }

  get totalClicks(): number {
    return this.rows.reduce((total, row) => total + row.clicks, 0);
  }

  get averageCtr(): number {
    if (!this.rows.length) {
      return 0;
    }

    return this.rows.reduce((total, row) => total + (row.ctr ?? 0), 0) / this.rows.length;
  }

  get averageCpc(): number {
    if (!this.rows.length) {
      return 0;
    }

    return this.rows.reduce((total, row) => total + (row.cpc ?? 0), 0) / this.rows.length;
  }

  get currencyCode(): string {
    return this.report.currency || 'USD';
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.report.totalPages }, (_, index) => index + 1);
  }

  get shouldShowPagination(): boolean {
    return this.report.totalPages > 1 || this.report.totalItems > this.report.pageSize;
  }

  onApplyFilters(): void {
    if (!this.isDateRangeValid()) {
      this.errorMessage = 'La fecha inicial no puede ser mayor a la fecha final.';
      return;
    }

    this.page = 1;
    this.loadReport();
  }

  onResetFilters(): void {
    const defaultRange = createDefaultDateRange(30);
    this.dateFrom = defaultRange.dateFrom;
    this.dateTo = defaultRange.dateTo;
    this.search = '';
    this.selectedAdAccountId = '';
    this.selectedCampaignId = '';
    this.page = 1;
    this.pageSize = 20;
    this.sortBy = 'dateStart';
    this.sortDirection = SortDirection.Desc;
    this.campaigns = [];
    this.loadFilterOptions();
    this.loadReport();
  }

  onPageChange(nextPage: number): void {
    if (nextPage < 1 || nextPage > this.report.totalPages || nextPage === this.page) {
      return;
    }

    this.page = nextPage;
    this.loadReport();
  }

  onPageSizeChange(value: number | string): void {
    this.pageSize = Number(value);
    this.page = 1;
    this.loadReport();
  }

  onAdAccountChange(adAccountId: string): void {
    this.selectedAdAccountId = adAccountId;
    this.selectedCampaignId = '';
    this.page = 1;
    this.loadCampaignOptions();
  }

  onRetry(): void {
    this.loadReport();
  }

  trackByRow(index: number, row: InsightMetrics): string {
    return `${row.dateStart}-${row.dateEnd}-${index}`;
  }

  private loadFilterOptions(): void {
    this.isLoadingFilters = true;
    this.errorMessage = null;

    this.adAccountsService
      .getAdAccounts({ Page: 1, PageSize: 100, SortBy: 'name', SortDirection: SortDirection.Asc })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingFilters = false;
        }),
      )
      .subscribe({
        next: (response: PaginatedResponse<AdAccount>) => {
          this.adAccounts = response.items ?? [];
          this.loadCampaignOptions();
        },
        error: () => {
          this.adAccounts = [];
          this.campaigns = [];
        },
      });
  }

  private loadCampaignOptions(): void {
    this.isLoadingFilters = true;

    const params: CampaignsQueryParams = {
      Page: 1,
      PageSize: 100,
      SortBy: 'name',
      SortDirection: SortDirection.Asc,
      AdAccountId: this.selectedAdAccountId || undefined,
    };

    this.campaignsService
      .getCampaigns(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingFilters = false;
        }),
      )
      .subscribe({
        next: (response: PaginatedResponse<Campaign>) => {
          this.campaigns = response.items ?? [];
        },
        error: () => {
          this.campaigns = [];
        },
      });
  }

  private loadReport(): void {
    if (!this.isDateRangeValid()) {
      return;
    }

    this.isLoadingReport = true;
    this.errorMessage = null;

    const params: InsightsReportQueryParams = {
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      adAccountId: this.selectedAdAccountId || undefined,
      campaignId: this.selectedCampaignId || undefined,
      Search: this.search || undefined,
      Page: this.page,
      PageSize: this.pageSize,
      SortBy: this.sortBy,
      SortDirection: this.sortDirection,
    };

    this.reportsService
      .getInsightsReport(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingReport = false;
        }),
      )
      .subscribe({
        next: (response: InsightsReportResponse) => {
          this.report = response;
          this.page = response.page;
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudo cargar el reporte de insights.',
          );
          this.report = this.createEmptyReport();
        },
      });
  }

  private isDateRangeValid(): boolean {
    return !this.dateFrom || !this.dateTo || this.dateFrom <= this.dateTo;
  }

  private createEmptyReport(): InsightsReportResponse {
    return {
      rows: [],
      page: 1,
      pageSize: this.pageSize,
      totalItems: 0,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };
  }
}
