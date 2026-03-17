import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdSetsService } from '../../../core/api/services/adsets.service';
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

  readonly form = new FormGroup({
    campaignId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl('ACTIVE', { nonNullable: true }),
    dailyBudget: new FormControl(0, { nonNullable: true }),
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly adSetsService: AdSetsService,
    private readonly toastService: ToastService,
  ) {}

  onEditAdSet(adSet: AdSet): void {
    this.selectedAdSet = adSet;
    this.form.patchValue({
      campaignId: adSet.campaignId,
      name: adSet.name,
      status: adSet.status,
      dailyBudget: adSet.dailyBudget ?? 0,
    });
  }

  onSubmit(): void {
    this.isSubmitting = true;
    const value = this.form.getRawValue();

    const request$ = this.selectedAdSet
      ? this.adSetsService.updateAdSet(this.selectedAdSet.id, {
          name: value.name,
          status: value.status,
          budget: value.dailyBudget,
        } satisfies UpdateAdSetRequest)
      : this.adSetsService.createAdSet(value as CreateAdSetRequest);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isSubmitting = false)),
      )
      .subscribe({
        next: () => {
          this.selectedAdSet = null;
          this.form.reset({ campaignId: '', name: '', status: 'ACTIVE', dailyBudget: 0 });
          this.toastService.success({ title: 'Ad Sets', message: 'Registro guardado correctamente.' });
        },
        error: () => {
          this.toastService.error({ title: 'Ad Sets', message: 'No se pudo guardar el ad set.' });
        },
      });
  }
}
