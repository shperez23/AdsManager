import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Campaign, CreateCampaignRequest, UpdateCampaignRequest } from '../../../../shared/models';

export interface CampaignFormSubmitEvent {
  mode: 'create' | 'edit';
  value: CreateCampaignRequest | UpdateCampaignRequest;
}

@Component({
  selector: 'app-campaigns-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './campaigns-form.component.html',
})
export class CampaignsFormComponent implements OnChanges {
  @Input() campaign: Campaign | null = null;
  @Input() isSubmitting = false;

  @Output() submitForm = new EventEmitter<CampaignFormSubmitEvent>();

  readonly form = new FormGroup({
    adAccountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl('ACTIVE', { nonNullable: true }),
  });

  get isEditMode(): boolean {
    return !!this.campaign;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['campaign']) return;

    this.form.reset({
      adAccountId: this.campaign?.adAccountId ?? '',
      name: this.campaign?.name ?? '',
      status: this.campaign?.status ?? 'ACTIVE',
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.submitForm.emit({
      mode: this.isEditMode ? 'edit' : 'create',
      value: this.isEditMode ? { name: value.name, status: value.status } : value,
    });
  }
}
