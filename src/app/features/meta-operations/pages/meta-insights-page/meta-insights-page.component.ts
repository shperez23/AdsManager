import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { MetaService } from '../../../../core/api/services/meta.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { AdAccount, InsightMetrics, InsightsResponse } from '../../../../shared/models';
import { EmptyStateComponent } from '../../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';
import { createDefaultDateRange } from '../../../../shared/utils/insights.util';
import { MetaNavigationComponent } from '../../components/meta-navigation/meta-navigation.component';

type MetaInsightsFormGroup = FormGroup<{
  adAccountId: FormControl<string>;
  dateFrom: FormControl<string>;
  dateTo: FormControl<string>;
  level: FormControl<string>;
}>;

@Component({
  selector: 'app-meta-insights-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DecimalPipe,
    PercentPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    MetaNavigationComponent,
  ],
  templateUrl: './meta-insights-page.component.html',
})
export class MetaInsightsPageComponent implements OnInit {
  readonly form: MetaInsightsFormGroup = new FormGroup({
    adAccountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dateFrom: new FormControl(createDefaultDateRange(30).dateFrom, { nonNullable: true }),
    dateTo: new FormControl(createDefaultDateRange(30).dateTo, { nonNullable: true }),
    level: new FormControl('campaign', { nonNullable: true }),
  });
  readonly today = createDefaultDateRange(0).dateTo;

  accounts: AdAccount[] = [];
  insights: InsightsResponse = { rows: [] };
  isLoadingAccounts = false;
  isLoadingInsights = false;
  errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly metaService: MetaService,
    private readonly requestFeedbackService: RequestFeedbackService,
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  get rows(): InsightMetrics[] {
    return this.insights.rows ?? [];
  }

  get currencyCode(): string {
    return this.insights.currency || 'USD';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loadInsights();
  }

  onRetry(): void {
    this.loadInsights();
  }

  trackByRow(index: number, row: InsightMetrics): string {
    return `${row.dateStart}-${row.dateEnd}-${index}`;
  }

  private loadAccounts(): void {
    this.isLoadingAccounts = true;

    this.metaService
      .getMetaAdAccounts()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingAccounts = false;
        }),
      )
      .subscribe({
        next: (accounts) => {
          this.accounts = accounts;
          if (!this.form.controls.adAccountId.value && accounts.length) {
            this.form.controls.adAccountId.setValue(accounts[0].id);
            this.loadInsights();
          }
        },
        error: (error) => {
          this.accounts = [];
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudieron cargar las cuentas Meta.',
          );
        },
      });
  }

  private loadInsights(): void {
    if (this.form.invalid) {
      return;
    }

    this.isLoadingInsights = true;
    this.errorMessage = null;

    const value = this.form.getRawValue();
    this.metaService
      .getMetaAdAccountInsights(value.adAccountId, value.dateFrom, value.dateTo, value.level)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingInsights = false;
        }),
      )
      .subscribe({
        next: (insights) => {
          this.insights = insights;
        },
        error: (error) => {
          this.insights = { rows: [] };
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudieron cargar los insights de Meta.',
          );
        },
      });
  }
}
