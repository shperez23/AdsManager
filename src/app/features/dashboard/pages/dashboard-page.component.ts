import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { ToastType } from '../../../core/notifications/toast.model';
import { ToastService } from '../../../core/notifications/toast.service';

interface DashboardMetric {
  readonly label: string;
  readonly value: string;
  readonly trend: string;
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
export class DashboardPageComponent {
  readonly metrics: DashboardMetric[] = [
    { label: 'Spend total', value: '$248.2k', trend: '+12.8%' },
    { label: 'CTR promedio', value: '4.63%', trend: '+0.9%' },
    { label: 'ROAS', value: '3.9x', trend: '+0.3x' },
  ];

  readonly toastActions: ToastAction[] = [
    { type: 'success', label: 'Success' },
    { type: 'error', label: 'Error' },
    { type: 'warning', label: 'Warning' },
    { type: 'info', label: 'Info' },
  ];

  constructor(private readonly toastService: ToastService) {}

  showToast(type: ToastType): void {
    this.toastService[type]({
      title: `Notificación ${type}`,
      message: 'Ejemplo de toast integrado con TailwindCSS.',
    });
  }
}
