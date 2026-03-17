import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdsetsListComponent } from '../components/adsets-list/adsets-list.component';
import { AdSet, CreateAdSetRequest, UpdateAdSetRequest } from '../../../shared/models';
import { AdSetsService } from '../../../core/api/services/adsets.service';

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

  constructor(private readonly adSetsService: AdSetsService) {}

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
        } as UpdateAdSetRequest)
      : this.adSetsService.createAdSet(value as CreateAdSetRequest);

    request$.pipe(finalize(() => (this.isSubmitting = false))).subscribe({
      next: () => {
        this.selectedAdSet = null;
        this.form.reset({ campaignId: '', name: '', status: 'ACTIVE', dailyBudget: 0 });
      },
    });
  }
}
