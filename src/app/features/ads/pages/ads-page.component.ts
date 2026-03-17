import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { finalize } from 'rxjs';

import { AdsFormComponent, AdsFormSubmitEvent } from '../components/ads-form/ads-form.component';
import { AdsListComponent } from '../components/ads-list/ads-list.component';
import { Ad, CreateAdRequest, UpdateAdRequest } from '../../../shared/models';
import { AdsService } from '../../../core/api/services/ads.service';

@Component({
  selector: 'app-ads-page',
  standalone: true,
  imports: [CommonModule, AdsListComponent, AdsFormComponent],
  templateUrl: './ads-page.component.html',
})
export class AdsPageComponent {
  selectedAd: Ad | null = null;
  isSubmitting = false;

  constructor(private readonly adsService: AdsService) {}

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
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.selectedAd = null;
        },
      });
  }
}
