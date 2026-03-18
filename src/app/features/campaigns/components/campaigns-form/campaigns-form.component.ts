import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Campaign, CreateCampaignRequest, UpdateCampaignRequest } from '../../../../shared/models';

export interface CampaignFormSubmitEvent {
  mode: 'create' | 'edit';
  value: CreateCampaignRequest | UpdateCampaignRequest;
}

type CampaignStatus = 'ACTIVE' | 'PAUSED';

type CampaignFormGroup = FormGroup<{
  adAccountId: FormControl<string>;
  name: FormControl<string>;
  objective: FormControl<string>;
  status: FormControl<CampaignStatus>;
  dailyBudget: FormControl<number | null>;
  lifetimeBudget: FormControl<number | null>;
  startDate: FormControl<string>;
  endDate: FormControl<string>;
}>;

@Component({
  selector: 'app-campaigns-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './campaigns-form.component.html',
})
export class CampaignsFormComponent implements OnChanges {
  @Input() campaign: Campaign | null = null;
  @Input() isSubmitting = false;

  @Output() cancelEdit = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<CampaignFormSubmitEvent>();

  readonly statusOptions: CampaignStatus[] = ['ACTIVE', 'PAUSED'];

  readonly form: CampaignFormGroup = new FormGroup({
    adAccountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    objective: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    status: new FormControl<CampaignStatus>('ACTIVE', { nonNullable: true, validators: [Validators.required] }),
    dailyBudget: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    lifetimeBudget: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    startDate: new FormControl('', { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true }),
  });

  get isEditMode(): boolean {
    return !!this.campaign;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['campaign']) {
      return;
    }

    this.form.reset({
      adAccountId: this.campaign?.adAccountId ?? '',
      name: this.campaign?.name ?? '',
      objective: this.campaign?.objective ?? '',
      status: this.toCampaignStatus(this.campaign?.status),
      dailyBudget: this.campaign?.dailyBudget ?? null,
      lifetimeBudget: this.campaign?.lifetimeBudget ?? null,
      startDate: this.toDateTimeLocal(this.campaign?.startDate),
      endDate: this.toDateTimeLocal(this.campaign?.endDate),
    });
  }

  onCancel(): void {
    this.cancelEdit.emit();
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.submitForm.emit({
      mode: this.isEditMode ? 'edit' : 'create',
      value: this.isEditMode
        ? {
            name: value.name.trim(),
            objective: this.asOptional(value.objective),
            status: value.status,
            dailyBudget: this.asOptionalNumber(value.dailyBudget),
            lifetimeBudget: this.asOptionalNumber(value.lifetimeBudget),
            startDate: this.asOptionalDate(value.startDate),
            endDate: this.asOptionalDate(value.endDate),
          }
        : {
            adAccountId: value.adAccountId.trim(),
            name: value.name.trim(),
            objective: this.asOptional(value.objective),
            status: value.status,
            dailyBudget: this.asOptionalNumber(value.dailyBudget),
            lifetimeBudget: this.asOptionalNumber(value.lifetimeBudget),
          },
    });
  }

  hasError(controlName: keyof CampaignFormGroup['controls'], errorCode: string): boolean {
    const control = this.form.controls[controlName];
    return !!control && control.touched && control.hasError(errorCode);
  }

  private toCampaignStatus(status?: string): CampaignStatus {
    return status === 'PAUSED' ? 'PAUSED' : 'ACTIVE';
  }

  private toDateTimeLocal(value?: string): string {
    if (!value) {
      return '';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return parsedDate.toISOString().slice(0, 16);
  }

  private asOptional(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private asOptionalNumber(value: number | null): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private asOptionalDate(value: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString();
  }
}
