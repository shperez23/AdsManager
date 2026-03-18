import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { AdsService } from '../../../core/api/services/ads.service';
import { AdSetsService } from '../../../core/api/services/adsets.service';
import { RequestFeedbackService } from '../../../core/errors/request-feedback.service';
import { ToastService } from '../../../core/notifications/toast.service';
import {
  Ad,
  AdSet,
  CreateAdRequest,
  PaginatedResponse,
  UpdateAdRequest,
} from '../../../shared/models';
import { AdsFormComponent, AdsFormSubmitEvent } from '../components/ads-form/ads-form.component';
import { AdsListComponent } from '../components/ads-list/ads-list.component';

@Component({
  selector: 'app-ads-page',
  standalone: true,
  imports: [CommonModule, AdsListComponent, AdsFormComponent],
  templateUrl: './ads-page.component.html',
})
export class AdsPageComponent implements OnInit {
  selectedAd: Ad | null = null;
  isSubmitting = false;
  isLoadingAd = false;
  isLoadingAdSetOptions = false;
  reloadKey = 0;
  adSetOptions: AdSet[] = [];

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly adsService: AdsService,
    private readonly adSetsService: AdSetsService,
    private readonly requestFeedbackService: RequestFeedbackService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadAdSetOptions();
  }

  onEditAd(ad: Ad): void {
    this.isLoadingAd = true;

    this.adsService
      .getAdById(ad.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingAd = false;
        }),
      )
      .subscribe({
        next: (adDetail) => {
          this.selectedAd = adDetail;
        },
        error: (error) => {
          this.requestFeedbackService.showError(
            'Anuncios',
            error,
            'No se pudo cargar el detalle real del anuncio.',
          );
        },
      });
  }

  onCancelEdit(): void {
    this.selectedAd = null;
  }

  onSubmitForm(event: AdsFormSubmitEvent): void {
    this.isSubmitting = true;

    const request$ =
      event.mode === 'edit' && this.selectedAd
        ? this.adsService.updateAd(this.selectedAd.id, event.value as UpdateAdRequest)
        : this.adsService.createAd(event.value as CreateAdRequest);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isSubmitting = false)),
      )
      .subscribe({
        next: () => {
          this.selectedAd = null;
          this.reloadKey += 1;
          this.toastService.success({ title: 'Anuncios', message: 'Registro guardado correctamente.' });
        },
        error: (error) => {
          this.requestFeedbackService.showError('Anuncios', error, 'No se pudo guardar el anuncio.');
        },
      });
  }

  private loadAdSetOptions(): void {
    this.isLoadingAdSetOptions = true;

    this.adSetsService
      .getAdSets({ Page: 1, PageSize: 100, SortBy: 'name' })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingAdSetOptions = false;
        }),
      )
      .subscribe({
        next: (response: PaginatedResponse<AdSet>) => {
          this.adSetOptions = response.items ?? [];
        },
        error: () => {
          this.adSetOptions = [];
        },
      });
  }
}
