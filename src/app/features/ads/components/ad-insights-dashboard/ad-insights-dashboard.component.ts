import { CommonModule, CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';

import { AdsService } from '../../../../core/api/services/ads.service';
import { InsightMetrics } from '../../../../shared/models';

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

  private renderedCanvases: HTMLCanvasElement[] = [];
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
      labels,
      data: this.rows.map((row) => row.impressions),
      strokeColor: '#2563eb',
      fillColor: 'rgba(37, 99, 235, 0.2)',
    });

    this.createChart(this.clicksCanvas, {
      labels,
      data: this.rows.map((row) => row.clicks),
      strokeColor: '#0d9488',
      fillColor: 'rgba(13, 148, 136, 0.2)',
    });

    this.createChart(this.conversionsCanvas, {
      labels,
      data: this.rows.map((row) => row.conversions ?? 0),
      strokeColor: '#7c3aed',
      fillColor: 'rgba(124, 58, 237, 0.2)',
    });

    this.createChart(this.spendCanvas, {
      labels,
      data: this.rows.map((row) => row.spend),
      strokeColor: '#ea580c',
      fillColor: 'rgba(234, 88, 12, 0.2)',
    });
  }

  private createChart(
    canvas: ElementRef<HTMLCanvasElement> | undefined,
    config: {
      labels: string[];
      data: number[];
      strokeColor: string;
      fillColor: string;
    },
  ): void {
    if (!canvas) {
      return;
    }

    const nativeCanvas = canvas.nativeElement;
    const context = nativeCanvas.getContext('2d');
    if (!context) {
      return;
    }

    const width = nativeCanvas.clientWidth || 600;
    const height = nativeCanvas.clientHeight || 256;
    nativeCanvas.width = width;
    nativeCanvas.height = height;

    context.clearRect(0, 0, width, height);

    if (config.data.length === 0) {
      return;
    }

    const minValue = Math.min(...config.data);
    const maxValue = Math.max(...config.data);
    const range = maxValue - minValue || 1;
    const horizontalPadding = 24;
    const verticalPadding = 20;
    const drawWidth = width - horizontalPadding * 2;
    const drawHeight = height - verticalPadding * 2;

    const points = config.data.map((value, index) => {
      const x =
        horizontalPadding +
        (drawWidth * index) / Math.max(config.data.length - 1, 1);
      const y =
        verticalPadding +
        drawHeight - ((value - minValue) / range) * drawHeight;
      return { x, y };
    });

    context.beginPath();
    context.moveTo(points[0].x, height - verticalPadding);
    points.forEach((point) => context.lineTo(point.x, point.y));
    context.lineTo(points[points.length - 1].x, height - verticalPadding);
    context.closePath();
    context.fillStyle = config.fillColor;
    context.fill();

    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
        return;
      }
      context.lineTo(point.x, point.y);
    });
    context.strokeStyle = config.strokeColor;
    context.lineWidth = 2;
    context.stroke();

    this.renderedCanvases.push(nativeCanvas);
  }

  private destroyCharts(): void {
    this.renderedCanvases.forEach((canvas) => {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
    this.renderedCanvases = [];
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
