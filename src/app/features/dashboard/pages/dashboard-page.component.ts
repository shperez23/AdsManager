import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';

import { DashboardService } from '../../../core/api/services/dashboard.service';
import { ToastType } from '../../../core/notifications/toast.model';
import { ToastService } from '../../../core/notifications/toast.service';

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
  imports: [CommonModule],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit {
  readonly toastActions: ToastAction[] = [
    { type: 'success', label: 'Success' },
    { type: 'error', label: 'Error' },
    { type: 'warning', label: 'Warning' },
    { type: 'info', label: 'Info' },
  ];

  metrics: DashboardMetric[] = [];
  isLoading = false;

  constructor(
    private readonly toastService: ToastService,
    private readonly dashboardService: DashboardService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.dashboardService
      .getDashboard()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.metrics = [
            { label: 'Spend total', value: `$${response.totalSpend.toLocaleString()}` },
            { label: 'CTR promedio', value: `${response.ctr?.toFixed(2) ?? '0.00'}%` },
            { label: 'ROAS', value: `${response.roas?.toFixed(2) ?? '0.00'}x` },
          ];
        },
        error: () => {
          this.toastService.error({ title: 'Dashboard', message: 'No se pudo cargar el dashboard.' });
          this.metrics = [];
        },
      });
  }

  showToast(type: ToastType): void {
    this.toastService[type]({
      title: `Notificación ${type}`,
      message: 'Ejemplo de toast integrado con TailwindCSS.',
    });
  }
}
