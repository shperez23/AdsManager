import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ReportsService } from '../../../../core/api/services/reports.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { InsightMetrics } from '../../../../shared/models';
import { createDefaultDateRange } from '../../../../shared/utils/insights.util';

@Component({
  selector: 'app-insights-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insights-summary.component.html',
})
export class InsightsSummaryComponent implements OnInit {
  readonly today = createDefaultDateRange(0).dateTo;

  startDate = createDefaultDateRange(7).dateFrom;
  endDate = createDefaultDateRange(7).dateTo;

  rows: InsightMetrics[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly reportsService: ReportsService,
    private readonly requestFeedbackService: RequestFeedbackService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  onApply(): void {
    if (this.startDate > this.endDate) {
      this.errorMessage = 'La fecha inicial no puede ser mayor a la final.';
      return;
    }

    this.load();
  }

  get totalSpend(): number {
    return this.rows.reduce((acc, row) => acc + row.spend, 0);
  }

  private load(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.reportsService
      .getInsightsReport({ dateFrom: this.startDate, dateTo: this.endDate, Page: 1, PageSize: 20 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: (response) => {
          this.rows = response.rows ?? [];
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudo cargar el reporte de insights.',
          );
          this.rows = [];
        },
      });
  }
}
