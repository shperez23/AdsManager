import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Ad } from '../../../../core/api/models';

type AdStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED';

export interface AdsFormValue {
  nombre: string;
  campaignId: string;
  status: AdStatus;
  presupuesto: number;
}

export interface AdsFormSubmitEvent {
  mode: 'create' | 'edit';
  value: AdsFormValue;
}

type AdsFormGroup = FormGroup<{
  nombre: FormControl<string>;
  campaignId: FormControl<string>;
  status: FormControl<AdStatus>;
  presupuesto: FormControl<number>;
}>;

@Component({
  selector: 'app-ads-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ads-form.component.html',
})
export class AdsFormComponent implements OnChanges {
  @Input() ad: Ad | null = null;
  @Input() isSubmitting = false;

  @Output() submitForm = new EventEmitter<AdsFormSubmitEvent>();
  @Output() cancelForm = new EventEmitter<void>();

  readonly statusOptions: AdStatus[] = ['ACTIVE', 'PAUSED', 'DISABLED'];

  readonly adsForm: AdsFormGroup = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    campaignId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(64)],
    }),
    status: new FormControl<AdStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    presupuesto: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  get isEditMode(): boolean {
    return !!this.ad?.id;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['ad']) {
      return;
    }

    if (!this.ad) {
      this.adsForm.reset({
        nombre: '',
        campaignId: '',
        status: 'ACTIVE',
        presupuesto: 0,
      });
      return;
    }

    this.adsForm.reset({
      nombre: this.ad.name ?? '',
      campaignId: this.ad.adSetId ?? '',
      status: this.toAdStatus(this.ad.status),
      presupuesto: this.ad.budget ?? 0,
    });
  }

  onSubmit(): void {
    if (this.adsForm.invalid) {
      this.adsForm.markAllAsTouched();
      return;
    }

    this.submitForm.emit({
      mode: this.isEditMode ? 'edit' : 'create',
      value: this.adsForm.getRawValue(),
    });
  }

  onCancel(): void {
    this.cancelForm.emit();
  }

  private toAdStatus(status: string | undefined): AdStatus {
    if (status === 'PAUSED' || status === 'DISABLED') {
      return status;
    }

    return 'ACTIVE';
  }
}
