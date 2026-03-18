import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdAccountsService } from '../../../../core/api/services/adaccounts.service';
import { CampaignsService } from '../../../../core/api/services/campaigns.service';
import { ReportsService } from '../../../../core/api/services/reports.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import {
  AdAccount,
  Campaign,
  CampaignsQueryParams,
  DashboardQueryParams,
  DashboardSummary,
  PaginatedResponse,
  SortDirection,
} from '../../../../shared/models';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';
import { createDefaultDateRange } from '../../../../shared/utils/insights.util';

type DashboardFormGroup = FormGroup<{
  dateFrom: FormControl<string>;
  dateTo: FormControl<string>;
  adAccountId: FormControl<string>;
  campaignId: FormControl<string>;
}>;

@Component({
  selector: 'app-reports-dashboard-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DecimalPipe,
    PercentPipe,
    ErrorStateComponent,
    LoadingStateComponent,
  ],
  templateUrl: './reports-dashboard-section.component.html',
})
export class ReportsDashboardSectionComponent implements OnInit {
  readonly today = createDefaultDateRange(0).dateTo;
  readonly dashboardForm: DashboardFormGroup = new FormGroup({
    dateFrom: new FormControl(createDefaultDateRange(30).dateFrom, { nonNullable: true }),
    dateTo: new FormControl(createDefaultDateRange(30).dateTo, { nonNullable: true }),
    adAccountId: new FormControl('', { nonNullable: true }),
    campaignId: new FormControl('', { nonNullable: true }),
  });

  adAccounts: AdAccount[] = [];
  campaigns: Campaign[] = [];
  summary: DashboardSummary | null = null;
  isLoadingFilters = false;
  isLoadingSummary = false;
  errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly reportsService: ReportsService,
    private readonly adAccountsService: AdAccountsService,
    private readonly campaignsService: CampaignsService,
    private readonly requestFeedbackService: RequestFeedbackService,
  ) {}

  ngOnInit(): void {
    this.dashboardForm.controls.adAccountId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((adAccountId) => {
        this.dashboardForm.controls.campaignId.setValue('', { emitEvent: false });
        this.loadCampaignOptions(adAccountId);
      });

    this.loadAdAccountOptions();
    this.loadSummary();
  }

  get currencyCode(): string {
    return 'USD';
  }

  onApplyFilters(): void {
    if (!this.isDateRangeValid()) {
      this.errorMessage = 'La fecha inicial no puede ser mayor a la fecha final.';
      return;
    }

    this.loadSummary();
  }

  onResetFilters(): void {
    const defaultRange = createDefaultDateRange(30);
    this.dashboardForm.reset({
      dateFrom: defaultRange.dateFrom,
      dateTo: defaultRange.dateTo,
      adAccountId: '',
      campaignId: '',
    });
    this.loadAdAccountOptions();
    this.loadSummary();
  }

  onRetry(): void {
    this.loadSummary();
  }

  private loadAdAccountOptions(): void {
    this.isLoadingFilters = true;

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
          this.loadCampaignOptions(this.dashboardForm.controls.adAccountId.value);
        },
        error: () => {
          this.adAccounts = [];
          this.campaigns = [];
        },
      });
  }

  private loadCampaignOptions(adAccountId?: string): void {
    this.isLoadingFilters = true;

    const params: CampaignsQueryParams = {
      Page: 1,
      PageSize: 100,
      SortBy: 'name',
      SortDirection: SortDirection.Asc,
      AdAccountId: adAccountId || undefined,
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

  private loadSummary(): void {
    if (!this.isDateRangeValid()) {
      return;
    }

    this.isLoadingSummary = true;
    this.errorMessage = null;

    const value = this.dashboardForm.getRawValue();
    const params: DashboardQueryParams = {
      dateFrom: value.dateFrom || undefined,
      dateTo: value.dateTo || undefined,
      adAccountId: value.adAccountId || undefined,
      campaignId: value.campaignId || undefined,
    };

    this.reportsService
      .getDashboardReport(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingSummary = false;
        }),
      )
      .subscribe({
        next: (summary) => {
          this.summary = summary;
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudo cargar el dashboard de reports.',
          );
          this.summary = null;
        },
      });
  }

  private isDateRangeValid(): boolean {
    const { dateFrom, dateTo } = this.dashboardForm.getRawValue();
    return !dateFrom || !dateTo || dateFrom <= dateTo;
  }
}
