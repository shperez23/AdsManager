import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { AdsService } from '../../../core/api/services/ads.service';
import { RequestFeedbackService } from '../../../core/errors/request-feedback.service';
import { ToastService } from '../../../core/notifications/toast.service';
import { Ad, CreateAdRequest, UpdateAdRequest } from '../../../shared/models';
import { AdsFormComponent, AdsFormSubmitEvent } from '../components/ads-form/ads-form.component';
import { AdsListComponent } from '../components/ads-list/ads-list.component';

@Component({
  selector: 'app-ads-page',
  standalone: true,
  imports: [CommonModule, AdsListComponent, AdsFormComponent],
  templateUrl: './ads-page.component.html',
})
export class AdsPageComponent {
  selectedAd: Ad | null = null;
  isSubmitting = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly adsService: AdsService,
    private readonly requestFeedbackService: RequestFeedbackService,
    private readonly toastService: ToastService,
  ) {}

  onEditAd(ad: Ad): void {
    this.selectedAd = ad;
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
          this.toastService.success({ title: 'Ads', message: 'Registro guardado correctamente.' });
        },
        error: (error) => {
          this.requestFeedbackService.showError('Ads', error, 'No se pudo guardar el ad.');
        },
      });
  }
}
