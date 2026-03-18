import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { CampaignsService } from '../../../../core/api/services/campaigns.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { Campaign, CampaignsQueryParams } from '../../../../shared/models';

@Component({
  selector: 'app-campaigns-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaigns-list.component.html',
})
export class CampaignsListComponent implements OnInit, OnChanges {
  @Input() reloadKey = 0;
  @Output() editCampaign = new EventEmitter<Campaign>();

  campaigns: Campaign[] = [];
  isLoading = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly requestFeedbackService: RequestFeedbackService,
  ) {}

  ngOnInit(): void {
    this.loadCampaigns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reloadKey'] && !changes['reloadKey'].firstChange) {
      this.loadCampaigns();
    }
  }

  onEdit(campaign: Campaign): void {
    this.editCampaign.emit(campaign);
  }

  onToggleStatus(campaign: Campaign): void {
    const request$ = campaign.status === 'ACTIVE'
      ? this.campaignsService.pauseCampaign(campaign.id)
      : this.campaignsService.activateCampaign(campaign.id);

    this.isLoading = true;
    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: () => this.loadCampaigns(),
        error: (error) => {
          this.requestFeedbackService.showError('Campaigns', error, 'No se pudo actualizar el estado de la campaign.');
        },
      });
  }

  private loadCampaigns(): void {
    this.isLoading = true;

    const params: CampaignsQueryParams = { Page: 1, PageSize: 20 };

    this.campaignsService
      .getCampaigns(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: (response) => {
          this.campaigns = response.items ?? [];
        },
        error: (error) => {
          this.campaigns = [];
          this.requestFeedbackService.showError('Campaigns', error, 'No se pudieron cargar las campaigns.');
        },
      });
  }
}
