import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { DashboardService } from '../../../core/api/services/dashboard.service';
import { RequestFeedbackService } from '../../../core/errors/request-feedback.service';
import { ToastType } from '../../../core/notifications/toast.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { DashboardQueryParams, DashboardSummary } from '../../../shared/models';
import { EmptyStateComponent } from '../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../shared/ui/states/loading-state.component';

interface DashboardMetric {
  readonly label: string;
  readonly value: string;
}

interface ToastAction {
  readonly type: ToastType;
  readonly label: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent, EmptyStateComponent, ErrorStateComponent],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit {
  readonly toastActions: ToastAction[] = [
    { type: 'success', label: 'Éxito' },
    { type: 'error', label: 'Error' },
    { type: 'warning', label: 'Advertencia' },
    { type: 'info', label: 'Información' },
  ];

  readonly filters: DashboardQueryParams = {
    dateFrom: '',
    dateTo: '',
    campaignId: '',
    adAccountId: '',
  };

  metrics: DashboardMetric[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  dashboardSummary: DashboardSummary | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly requestFeedbackService: RequestFeedbackService,
    private readonly toastService: ToastService,
    private readonly dashboardService: DashboardService,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get hasData(): boolean {
    if (!this.dashboardSummary) {
      return false;
    }

    const { totalSpend, totalClicks, totalImpressions, totalConversions } = this.dashboardSummary;
    return [totalSpend, totalClicks, totalImpressions, totalConversions].some((metric) => metric > 0);
  }

  onApplyFilters(): void {
    this.loadDashboard();
  }

  onResetFilters(): void {
    this.filters.dateFrom = '';
    this.filters.dateTo = '';
    this.filters.campaignId = '';
    this.filters.adAccountId = '';
    this.loadDashboard();
  }

  onRetry(): void {
    this.loadDashboard();
  }

  showToast(type: ToastType): void {
    this.toastService[type]({
      title: `Notificación ${type}`,
      message: 'Ejemplo de notificación integrada con TailwindCSS.',
    });
  }

  private loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.dashboardService
      .getDashboard(this.buildQueryParams())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: (response) => {
          this.dashboardSummary = response;
          this.metrics = this.mapMetrics(response);
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(error, 'No se pudo cargar el panel.');
          this.dashboardSummary = null;
          this.metrics = [];
          this.toastService.error({ title: 'Panel', message: this.errorMessage });
        },
      });
  }

  private buildQueryParams(): DashboardQueryParams {
    return {
      dateFrom: this.filters.dateFrom || undefined,
      dateTo: this.filters.dateTo || undefined,
      campaignId: this.filters.campaignId || undefined,
      adAccountId: this.filters.adAccountId || undefined,
    };
  }

  private mapMetrics(response: DashboardSummary): DashboardMetric[] {
    return [
      { label: 'Gasto total', value: `$${response.totalSpend.toLocaleString()}` },
      { label: 'CTR promedio', value: `${response.ctr?.toFixed(2) ?? '0.00'}%` },
      { label: 'ROAS', value: `${response.roas?.toFixed(2) ?? '0.00'}x` },
      { label: 'Clics', value: response.totalClicks.toLocaleString() },
      { label: 'Impresiones', value: response.totalImpressions.toLocaleString() },
      { label: 'Conversiones', value: response.totalConversions.toLocaleString() },
    ];
  }
}
