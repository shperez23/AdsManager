import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { AdsService } from '../../../../core/api/services/ads.service';
import { AdSetsService } from '../../../../core/api/services/adsets.service';
import { CampaignsService } from '../../../../core/api/services/campaigns.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { InsightMetrics } from '../../../../shared/models';
import { createDefaultDateRange } from '../../../../shared/utils/insights.util';

type InsightsEntityLevel = 'campaigns' | 'adsets' | 'ads';

interface InsightsEntityOption {
  id: string;
  name: string;
  status: string;
}

@Component({
  selector: 'app-entity-insights-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './entity-insights-panel.component.html',
})
export class EntityInsightsPanelComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) entityLevel: InsightsEntityLevel = 'campaigns';

  @ViewChild('impressionsCanvas') private impressionsCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('spendCanvas') private spendCanvas?: ElementRef<HTMLCanvasElement>;

  readonly today = createDefaultDateRange(0).dateTo;

  startDate = createDefaultDateRange(7).dateFrom;
  endDate = createDefaultDateRange(7).dateTo;

  options: InsightsEntityOption[] = [];
  selectedEntityId = '';
  rows: InsightMetrics[] = [];
  isLoadingOptions = false;
  isLoadingInsights = false;
  errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private renderedCanvases: HTMLCanvasElement[] = [];

  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly adSetsService: AdSetsService,
    private readonly adsService: AdsService,
    private readonly requestFeedbackService: RequestFeedbackService,
  ) {}

  ngAfterViewInit(): void {
    this.loadEntityOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['entityLevel'] || changes['entityLevel'].firstChange || !this.impressionsCanvas) {
      return;
    }

    this.rows = [];
    this.options = [];
    this.selectedEntityId = '';
    this.destroyCharts();
    this.loadEntityOptions();
  }

  get entityLabel(): string {
    if (this.entityLevel === 'campaigns') {
      return 'campaign';
    }

    if (this.entityLevel === 'adsets') {
      return 'ad set';
    }

    return 'ad';
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

  get averageCtr(): number {
    if (!this.rows.length) {
      return 0;
    }

    const totalCtr = this.rows.reduce((acc, row) => acc + (row.ctr ?? 0), 0);
    return totalCtr / this.rows.length;
  }

  get averageCpc(): number {
    if (!this.rows.length) {
      return 0;
    }

    const totalCpc = this.rows.reduce((acc, row) => acc + (row.cpc ?? 0), 0);
    return totalCpc / this.rows.length;
  }

  onApply(): void {
    if (this.startDate > this.endDate) {
      this.errorMessage = 'La fecha inicial no puede ser mayor a la fecha final.';
      return;
    }

    this.loadInsights();
  }

  onEntityChange(entityId: string): void {
    this.selectedEntityId = entityId;
    this.loadInsights();
  }

  private loadEntityOptions(): void {
    this.isLoadingOptions = true;
    this.errorMessage = null;

    forkJoin({
      campaigns: this.campaignsService.getCampaigns({ Page: 1, PageSize: 50 }),
      adSets: this.adSetsService.getAdSets({ Page: 1, PageSize: 50 }),
      ads: this.adsService.getAds({ Page: 1, PageSize: 50 }),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingOptions = false;
        }),
      )
      .subscribe({
        next: ({ campaigns, adSets, ads }) => {
          const source =
            this.entityLevel === 'campaigns'
              ? campaigns.items
              : this.entityLevel === 'adsets'
                ? adSets.items
                : ads.items;

          this.options = source.map((item) => ({
            id: item.id,
            name: item.name,
            status: item.status,
          }));

          this.selectedEntityId = this.options[0]?.id ?? '';
          this.loadInsights();
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            `No se pudo cargar la lista de ${this.entityLabel}s.`,
          );
          this.options = [];
          this.selectedEntityId = '';
        },
      });
  }

  private loadInsights(): void {
    if (!this.selectedEntityId) {
      this.rows = [];
      this.destroyCharts();
      return;
    }

    this.isLoadingInsights = true;
    this.errorMessage = null;

    const request$ =
      this.entityLevel === 'campaigns'
        ? this.campaignsService.getCampaignInsights(this.selectedEntityId, this.startDate, this.endDate)
        : this.entityLevel === 'adsets'
          ? this.adSetsService.getAdSetInsights(this.selectedEntityId, this.startDate, this.endDate)
          : this.adsService.getAdInsights(this.selectedEntityId, this.startDate, this.endDate);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingInsights = false;
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
            `No se pudieron cargar los insights de ${this.entityLabel}.`,
          );
          this.rows = [];
          this.destroyCharts();
        },
      });
  }

  private renderCharts(): void {
    this.destroyCharts();

    this.createChart(this.impressionsCanvas, this.rows.map((row) => row.impressions), '#2563eb', 'rgba(37, 99, 235, 0.2)');
    this.createChart(this.spendCanvas, this.rows.map((row) => row.spend), '#ea580c', 'rgba(234, 88, 12, 0.2)');
  }

  private createChart(
    canvas: ElementRef<HTMLCanvasElement> | undefined,
    values: number[],
    strokeColor: string,
    fillColor: string,
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
    const height = nativeCanvas.clientHeight || 220;
    nativeCanvas.width = width;
    nativeCanvas.height = height;
    context.clearRect(0, 0, width, height);

    if (values.length === 0) {
      return;
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    const xPadding = 20;
    const yPadding = 20;
    const drawWidth = width - xPadding * 2;
    const drawHeight = height - yPadding * 2;

    const points = values.map((value, index) => ({
      x: xPadding + (drawWidth * index) / Math.max(values.length - 1, 1),
      y: yPadding + drawHeight - ((value - minValue) / range) * drawHeight,
    }));

    context.beginPath();
    context.moveTo(points[0].x, height - yPadding);
    points.forEach((point) => context.lineTo(point.x, point.y));
    context.lineTo(points[points.length - 1].x, height - yPadding);
    context.closePath();
    context.fillStyle = fillColor;
    context.fill();

    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
        return;
      }

      context.lineTo(point.x, point.y);
    });
    context.strokeStyle = strokeColor;
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
