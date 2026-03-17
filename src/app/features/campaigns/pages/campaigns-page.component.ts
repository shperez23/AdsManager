import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { finalize } from 'rxjs';

import { CampaignsService } from '../../../core/api/services/campaigns.service';
import { ToastService } from '../../../core/notifications/toast.service';
import { Campaign, CreateCampaignRequest, UpdateCampaignRequest } from '../../../shared/models';
import { CampaignsFormComponent, CampaignFormSubmitEvent } from '../components/campaigns-form/campaigns-form.component';
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

  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly toastService: ToastService,
  ) {}

  onEditCampaign(campaign: Campaign): void {
    this.selectedCampaign = campaign;
  }

  onSubmit(event: CampaignFormSubmitEvent): void {
    this.isSubmitting = true;

    const request$ = event.mode === 'edit' && this.selectedCampaign
      ? this.campaignsService.updateCampaign(this.selectedCampaign.id, event.value as UpdateCampaignRequest)
      : this.campaignsService.createCampaign(event.value as CreateCampaignRequest);

    request$.pipe(finalize(() => (this.isSubmitting = false))).subscribe({
      next: () => {
        this.selectedCampaign = null;
        this.toastService.success({ title: 'Campaigns', message: 'Operación completada.' });
      },
      error: () => this.toastService.error({ title: 'Campaigns', message: 'No se pudo guardar la campaign.' }),
    });
  }
}
