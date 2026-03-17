import { CommonModule, CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subject, finalize, takeUntil } from 'rxjs';

import { InsightMetrics } from '../../../../core/api/models';
import { AdsService } from '../../../../core/api/services/ads.service';

Chart.register(...registerables);

@Component({
  selector: 'app-ad-insights-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './ad-insights-dashboard.component.html',
})
export class AdInsightsDashboardComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) adId = '';

  @ViewChild('impressionsCanvas') private impressionsCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('clicksCanvas') private clicksCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('conversionsCanvas') private conversionsCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('spendCanvas') private spendCanvas?: ElementRef<HTMLCanvasElement>;

  readonly today = this.toDateInput(new Date());

  startDate = this.toDateInput(this.addDays(new Date(), -7));
  endDate = this.today;

  rows: InsightMetrics[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  private chartInstances: Chart[] = [];
  private chartsReady = false;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly adsService: AdsService) {}

  ngAfterViewInit(): void {
    this.chartsReady = true;
    this.loadInsights();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  onApplyDateRange(): void {
    if (this.startDate > this.endDate) {
      this.errorMessage = 'La fecha inicial no puede ser mayor a la fecha final.';
      return;
    }

    this.loadInsights();
  }

  get totalImpressions(): number {
    return this.rows.reduce((acc, row) => acc + row.impressions, 0);
  }

  get totalClicks(): number {
    return this.rows.reduce((acc, row) => acc + row.clicks, 0);
  }

  get totalConversions(): number {
    return this.rows.reduce((acc, row) => acc + (row.conversions ?? 0), 0);
  }

  get totalSpend(): number {
    return this.rows.reduce((acc, row) => acc + row.spend, 0);
  }

  private loadInsights(): void {
    if (!this.adId) {
      this.errorMessage = 'Debes seleccionar un anuncio para ver insights.';
      this.rows = [];
      this.destroyCharts();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.adsService
      .getAdInsights(this.adId, this.startDate, this.endDate)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.rows = response.rows ?? [];
          this.renderCharts();
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar los insights del anuncio.';
          this.rows = [];
          this.destroyCharts();
        },
      });
  }

  private renderCharts(): void {
    if (!this.chartsReady) {
      return;
    }

    this.destroyCharts();

    const labels = this.rows.map((row) => row.dateStart);

    this.createChart(this.impressionsCanvas, {
      label: 'Impresiones',
      labels,
      data: this.rows.map((row) => row.impressions),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.2)',
    });

    this.createChart(this.clicksCanvas, {
      label: 'Clicks',
      labels,
      data: this.rows.map((row) => row.clicks),
      borderColor: '#0d9488',
      backgroundColor: 'rgba(13, 148, 136, 0.2)',
    });

    this.createChart(this.conversionsCanvas, {
      label: 'Conversions',
      labels,
      data: this.rows.map((row) => row.conversions ?? 0),
      borderColor: '#7c3aed',
      backgroundColor: 'rgba(124, 58, 237, 0.2)',
    });

    this.createChart(this.spendCanvas, {
      label: 'Spend',
      labels,
      data: this.rows.map((row) => row.spend),
      borderColor: '#ea580c',
      backgroundColor: 'rgba(234, 88, 12, 0.2)',
    });
  }

  private createChart(
    canvas: ElementRef<HTMLCanvasElement> | undefined,
    config: {
      label: string;
      labels: string[];
      data: number[];
      borderColor: string;
      backgroundColor: string;
    },
  ): void {
    if (!canvas) {
      return;
    }

    const chartConfiguration: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: config.labels,
        datasets: [
          {
            label: config.label,
            data: config.data,
            borderColor: config.borderColor,
            backgroundColor: config.backgroundColor,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };

    const chart = new Chart(canvas.nativeElement, chartConfiguration);
    this.chartInstances.push(chart);
  }

  private destroyCharts(): void {
    this.chartInstances.forEach((chart) => chart.destroy());
    this.chartInstances = [];
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
