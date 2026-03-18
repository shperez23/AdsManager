import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdSetsService } from '../../../core/api/services/adsets.service';
import { RequestFeedbackService } from '../../../core/errors/request-feedback.service';
import { ToastService } from '../../../core/notifications/toast.service';
import { AdSet, CreateAdSetRequest, UpdateAdSetRequest } from '../../../shared/models';
import { AdsetsListComponent } from '../components/adsets-list/adsets-list.component';

type AdSetStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED';

type AdSetFormGroup = FormGroup<{
  campaignId: FormControl<string>;
  name: FormControl<string>;
  status: FormControl<AdSetStatus>;
  dailyBudget: FormControl<number | null>;
  billingEvent: FormControl<string>;
  optimizationGoal: FormControl<string>;
  targetingJson: FormControl<string>;
  bidStrategy: FormControl<string>;
  startDate: FormControl<string>;
  endDate: FormControl<string>;
}>;

@Component({
  selector: 'app-ad-sets-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdsetsListComponent],
  templateUrl: './ad-sets-page.component.html',
})
export class AdSetsPageComponent {
  selectedAdSet: AdSet | null = null;
  isSubmitting = false;
  isLoadingAdSet = false;
  reloadKey = 0;

  readonly statusOptions: AdSetStatus[] = ['ACTIVE', 'PAUSED', 'DISABLED'];

  readonly form: AdSetFormGroup = new FormGroup({
    campaignId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    status: new FormControl<AdSetStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    dailyBudget: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    billingEvent: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
    optimizationGoal: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
    targetingJson: new FormControl('', { nonNullable: true }),
    bidStrategy: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
    startDate: new FormControl('', { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true }),
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly adSetsService: AdSetsService,
    private readonly requestFeedbackService: RequestFeedbackService,
    private readonly toastService: ToastService,
  ) {}

  get isEditMode(): boolean {
    return !!this.selectedAdSet;
  }

  onEditAdSet(adSet: AdSet): void {
    this.isLoadingAdSet = true;

    this.adSetsService
      .getAdSetById(adSet.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isLoadingAdSet = false)),
      )
      .subscribe({
        next: (adSetDetail) => {
          this.selectedAdSet = adSetDetail;
          this.form.reset(this.getFormValue(adSetDetail));
        },
        error: (error) => {
          this.requestFeedbackService.showError(
            'Ad Sets',
            error,
            'No se pudo cargar el ad set seleccionado.',
          );
        },
      });
  }

  onCancelEdit(): void {
    this.selectedAdSet = null;
    this.form.reset(this.getInitialFormValue());
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting || this.isLoadingAdSet) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const isEditMode = !!this.selectedAdSet;
    const value = this.form.getRawValue();

    const request$ = this.selectedAdSet
      ? this.adSetsService.updateAdSet(this.selectedAdSet.id, {
          name: value.name.trim(),
          status: value.status,
          budget: this.asOptionalNumber(value.dailyBudget),
          billingEvent: this.asOptional(value.billingEvent),
          optimizationGoal: this.asOptional(value.optimizationGoal),
          targetingJson: this.asOptional(value.targetingJson),
          bidStrategy: this.asOptional(value.bidStrategy),
          startDate: this.asOptionalDate(value.startDate),
          endDate: this.asOptionalDate(value.endDate),
        } satisfies UpdateAdSetRequest)
      : this.adSetsService.createAdSet({
          campaignId: value.campaignId.trim(),
          name: value.name.trim(),
          status: value.status,
          dailyBudget: this.asOptionalNumber(value.dailyBudget),
          billingEvent: this.asOptional(value.billingEvent),
          optimizationGoal: this.asOptional(value.optimizationGoal),
          targetingJson: this.asOptional(value.targetingJson),
          bidStrategy: this.asOptional(value.bidStrategy),
        } satisfies CreateAdSetRequest);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isSubmitting = false)),
      )
      .subscribe({
        next: () => {
          this.selectedAdSet = null;
          this.reloadKey += 1;
          this.form.reset(this.getInitialFormValue());
          this.toastService.success({
            title: 'Ad Sets',
            message: isEditMode
              ? 'Ad set actualizado correctamente.'
              : 'Ad set creado correctamente.',
          });
        },
        error: (error) => {
          this.requestFeedbackService.showError('Ad Sets', error, 'No se pudo guardar el ad set.');
        },
      });
  }

  hasError(controlName: keyof AdSetFormGroup['controls'], errorCode: string): boolean {
    const control = this.form.controls[controlName];
    return !!control && control.touched && control.hasError(errorCode);
  }

  private getInitialFormValue() {
    return {
      campaignId: '',
      name: '',
      status: 'ACTIVE' as AdSetStatus,
      dailyBudget: null,
      billingEvent: '',
      optimizationGoal: '',
      targetingJson: '',
      bidStrategy: '',
      startDate: '',
      endDate: '',
    };
  }

  private getFormValue(adSet: AdSet) {
    return {
      campaignId: adSet.campaignId,
      name: adSet.name,
      status: this.toAdSetStatus(adSet.status),
      dailyBudget: adSet.budget ?? adSet.dailyBudget ?? null,
      billingEvent: adSet.billingEvent ?? '',
      optimizationGoal: adSet.optimizationGoal ?? '',
      targetingJson: adSet.targetingJson ?? '',
      bidStrategy: adSet.bidStrategy ?? '',
      startDate: this.toDateTimeLocal(adSet.startDate),
      endDate: this.toDateTimeLocal(adSet.endDate),
    };
  }

  private toAdSetStatus(status?: string): AdSetStatus {
    return status === 'PAUSED' || status === 'DISABLED' ? status : 'ACTIVE';
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
