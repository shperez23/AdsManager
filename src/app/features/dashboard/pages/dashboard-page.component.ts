import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface DashboardMetric {
  readonly label: string;
  readonly value: string;
  readonly trend: string;
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
}
