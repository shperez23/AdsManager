import { CommonModule, CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdsService } from '../../../../core/api/services/ads.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { InsightMetrics } from '../../../../shared/models';
import { createDefaultDateRange } from '../../../../shared/utils/insights.util';

@Component({
  selector: 'app-ad-insights-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './ad-insights-dashboard.component.html',
})
export class AdInsightsDashboardComponent implements AfterViewInit {
  @Input({ required: true }) adId = '';

  @ViewChild('impressionsCanvas') private impressionsCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('clicksCanvas') private clicksCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('conversionsCanvas') private conversionsCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('spendCanvas') private spendCanvas?: ElementRef<HTMLCanvasElement>;

  readonly today = createDefaultDateRange(0).dateTo;

  startDate = createDefaultDateRange(7).dateFrom;
  endDate = createDefaultDateRange(7).dateTo;

  rows: InsightMetrics[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private renderedCanvases: HTMLCanvasElement[] = [];
  private chartsReady = false;

  constructor(
    private readonly adsService: AdsService,
    private readonly requestFeedbackService: RequestFeedbackService,
  ) {}

  ngAfterViewInit(): void {
    this.chartsReady = true;
    this.loadInsights();
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
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.rows = response.rows ?? [];
          this.renderCharts();
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudieron cargar los insights del anuncio.',
          );
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

    const points = config.data.map((value, index) => ({
      x: horizontalPadding + (drawWidth * index) / Math.max(config.data.length - 1, 1),
      y: verticalPadding + drawHeight - ((value - minValue) / range) * drawHeight,
    }));

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
      context?.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
}
