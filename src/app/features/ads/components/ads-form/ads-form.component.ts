import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Ad, CreateAdRequest, UpdateAdRequest } from '../../../../shared/models';

type AdStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED';

export interface AdsFormSubmitEvent {
  mode: 'create' | 'edit';
  value: CreateAdRequest | UpdateAdRequest;
}

type AdsFormGroup = FormGroup<{
  adSetId: FormControl<string>;
  name: FormControl<string>;
  status: FormControl<AdStatus>;
  creativeJson: FormControl<string>;
  previewUrl: FormControl<string>;
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

  readonly statusOptions: AdStatus[] = ['ACTIVE', 'PAUSED', 'DISABLED'];

  readonly adsForm: AdsFormGroup = new FormGroup({
    adSetId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    status: new FormControl<AdStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    creativeJson: new FormControl('', { nonNullable: true }),
    previewUrl: new FormControl('', { nonNullable: true }),
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
        adSetId: '',
        name: '',
        status: 'ACTIVE',
        creativeJson: '',
        previewUrl: '',
      });
      return;
    }

    this.adsForm.reset({
      adSetId: this.ad.adSetId ?? '',
      name: this.ad.name ?? '',
      status: this.toAdStatus(this.ad.status),
      creativeJson: this.ad.creativeJson ?? '',
      previewUrl: this.ad.previewUrl ?? '',
    });
  }

  onSubmit(): void {
    if (this.adsForm.invalid) {
      this.adsForm.markAllAsTouched();
      return;
    }

    const value = this.adsForm.getRawValue();

    this.submitForm.emit({
      mode: this.isEditMode ? 'edit' : 'create',
      value: this.isEditMode
        ? {
            name: value.name,
            status: value.status,
            creativeJson: value.creativeJson || undefined,
            previewUrl: value.previewUrl || undefined,
          }
        : {
            adSetId: value.adSetId,
            name: value.name,
            status: value.status,
            creativeJson: value.creativeJson || undefined,
            previewUrl: value.previewUrl || undefined,
          },
    });
  }

  private toAdStatus(status: string | undefined): AdStatus {
    if (status === 'PAUSED' || status === 'DISABLED') {
      return status;
    }

    return 'ACTIVE';
  }
}
