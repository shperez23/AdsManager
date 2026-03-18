import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { CampaignsService } from '../../../core/api/services/campaigns.service';
import { RequestFeedbackService } from '../../../core/errors/request-feedback.service';
import { ToastService } from '../../../core/notifications/toast.service';
import { Campaign, CreateCampaignRequest, UpdateCampaignRequest } from '../../../shared/models';
import { CampaignFormSubmitEvent, CampaignsFormComponent } from '../components/campaigns-form/campaigns-form.component';
import { CampaignsListComponent } from '../components/campaigns-list/campaigns-list.component';

@Component({
  selector: 'app-campaigns-page',
  standalone: true,
  imports: [CommonModule, CampaignsFormComponent, CampaignsListComponent],
  templateUrl: './campaigns-page.component.html',
})
export class CampaignsPageComponent {
  selectedCampaign: Campaign | null = null;
  isSubmitting = false;
  isLoadingCampaign = false;
  reloadKey = 0;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly requestFeedbackService: RequestFeedbackService,
    private readonly toastService: ToastService,
  ) {}

  onEditCampaign(campaign: Campaign): void {
    this.isLoadingCampaign = true;

    this.campaignsService
      .getCampaignById(campaign.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isLoadingCampaign = false)),
      )
      .subscribe({
        next: (campaignDetail) => {
          this.selectedCampaign = campaignDetail;
        },
        error: (error) => {
          this.requestFeedbackService.showError('Campañas', error, 'No se pudo cargar la campaña seleccionada.');
        },
      });
  }

  onCancelEdit(): void {
    this.selectedCampaign = null;
  }

  onSubmit(event: CampaignFormSubmitEvent): void {
    this.isSubmitting = true;

    const request$ = event.mode === 'edit' && this.selectedCampaign
      ? this.campaignsService.updateCampaign(this.selectedCampaign.id, event.value as UpdateCampaignRequest)
      : this.campaignsService.createCampaign(event.value as CreateCampaignRequest);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isSubmitting = false)),
      )
      .subscribe({
        next: () => {
          this.selectedCampaign = null;
          this.reloadKey += 1;
          this.toastService.success({
            title: 'Campañas',
            message: event.mode === 'edit' ? 'Campaña actualizada correctamente.' : 'Campaña creada correctamente.',
          });
        },
        error: (error) => {
          this.requestFeedbackService.showError('Campañas', error, 'No se pudo guardar la campaña.');
        },
      });
  }
}
