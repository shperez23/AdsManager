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

@Component({
  selector: 'app-ad-sets-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdsetsListComponent],
  templateUrl: './ad-sets-page.component.html',
})
export class AdSetsPageComponent {
  selectedAdSet: AdSet | null = null;
  isSubmitting = false;
  reloadKey = 0;

  readonly form = new FormGroup({
    campaignId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl('ACTIVE', { nonNullable: true }),
    dailyBudget: new FormControl(0, { nonNullable: true }),
    billingEvent: new FormControl('', { nonNullable: true }),
    optimizationGoal: new FormControl('', { nonNullable: true }),
    targetingJson: new FormControl('', { nonNullable: true }),
    bidStrategy: new FormControl('', { nonNullable: true }),
    startDate: new FormControl('', { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true }),
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly adSetsService: AdSetsService,
    private readonly requestFeedbackService: RequestFeedbackService,
    private readonly toastService: ToastService,
  ) {}

  onEditAdSet(adSet: AdSet): void {
    this.selectedAdSet = adSet;
    this.form.reset({
      campaignId: adSet.campaignId,
      name: adSet.name,
      status: adSet.status,
      dailyBudget: adSet.budget ?? adSet.dailyBudget ?? 0,
      billingEvent: adSet.billingEvent ?? '',
      optimizationGoal: adSet.optimizationGoal ?? '',
      targetingJson: adSet.targetingJson ?? '',
      bidStrategy: adSet.bidStrategy ?? '',
      startDate: this.toDateTimeLocal(adSet.startDate),
      endDate: this.toDateTimeLocal(adSet.endDate),
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
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
          this.toastService.success({ title: 'Ad Sets', message: 'Registro guardado correctamente.' });
        },
        error: (error) => {
          this.requestFeedbackService.showError('Ad Sets', error, 'No se pudo guardar el ad set.');
        },
      });
  }

  private getInitialFormValue() {
    return {
      campaignId: '',
      name: '',
      status: 'ACTIVE',
      dailyBudget: 0,
      billingEvent: '',
      optimizationGoal: '',
      targetingJson: '',
      bidStrategy: '',
      startDate: '',
      endDate: '',
    };
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

  private asOptionalNumber(value: number): number | undefined {
    return value > 0 ? value : undefined;
  }

  private asOptionalDate(value: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString();
  }
}
