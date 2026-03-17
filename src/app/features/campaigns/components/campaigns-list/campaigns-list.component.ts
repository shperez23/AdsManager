import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { CampaignsService } from '../../../../core/api/services/campaigns.service';
import { Campaign } from '../../../../shared/models';

@Component({
  selector: 'app-campaigns-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaigns-list.component.html',
})
export class CampaignsListComponent implements OnInit {
  @Output() editCampaign = new EventEmitter<Campaign>();

  campaigns: Campaign[] = [];
  isLoading = false;

  constructor(private readonly campaignsService: CampaignsService) {}

  ngOnInit(): void {
    this.loadCampaigns();
  }

  onEdit(campaign: Campaign): void {
    this.editCampaign.emit(campaign);
  }

  onToggleStatus(campaign: Campaign): void {
    const request$ = campaign.status === 'ACTIVE'
      ? this.campaignsService.pauseCampaign(campaign.id)
      : this.campaignsService.activateCampaign(campaign.id);

    this.isLoading = true;
    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({ next: () => this.loadCampaigns() });
  }

  private loadCampaigns(): void {
    this.isLoading = true;
    this.campaignsService
      .getCampaigns({ Page: 1, PageSize: 20 })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({ next: (response) => (this.campaigns = response.items ?? []) });
  }
}
