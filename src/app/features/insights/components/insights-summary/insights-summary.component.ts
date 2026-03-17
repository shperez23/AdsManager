import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ReportsService } from '../../../../core/api/services/reports.service';
import { InsightMetrics } from '../../../../shared/models';

@Component({
  selector: 'app-insights-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './insights-summary.component.html',
})
export class InsightsSummaryComponent implements OnInit {
  startDate = this.toDateInput(this.addDays(new Date(), -7));
  endDate = this.toDateInput(new Date());

  rows: InsightMetrics[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  constructor(private readonly reportsService: ReportsService) {}

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
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.rows = response.rows ?? [];
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar el reporte de insights.';
          this.rows = [];
        },
      });
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private addDays(date: Date, days: number): Date {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }
}
