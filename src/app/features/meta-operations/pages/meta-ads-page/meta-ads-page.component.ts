import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdSetsService } from '../../../../core/api/services/adsets.service';
import { MetaService } from '../../../../core/api/services/meta.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { ToastService } from '../../../../core/notifications/toast.service';
import {
  AdAccount,
  AdSet,
  MetaAdCreateRequest,
  MetaCampaign,
  PaginatedResponse,
} from '../../../../shared/models';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';
import { MetaNavigationComponent } from '../../components/meta-navigation/meta-navigation.component';

type MetaAdFormGroup = FormGroup<{
  adAccountId: FormControl<string>;
  campaignId: FormControl<string>;
  adSetId: FormControl<string>;
  name: FormControl<string>;
  status: FormControl<string>;
  creativeJson: FormControl<string>;
}>;

@Component({
  selector: 'app-meta-ads-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ErrorStateComponent,
    LoadingStateComponent,
    MetaNavigationComponent,
  ],
  templateUrl: './meta-ads-page.component.html',
})
export class MetaAdsPageComponent implements OnInit {
  readonly form: MetaAdFormGroup = new FormGroup({
    adAccountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    campaignId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    adSetId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl('ACTIVE', { nonNullable: true }),
    creativeJson: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  accounts: AdAccount[] = [];
  campaigns: MetaCampaign[] = [];
  adSets: AdSet[] = [];
  isLoadingAccounts = false;
  isLoadingCampaigns = false;
  isLoadingAdSets = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly metaService: MetaService,
    private readonly adSetsService: AdSetsService,
    private readonly requestFeedbackService: RequestFeedbackService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.form.controls.adAccountId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((adAccountId) => {
        this.form.patchValue({ campaignId: '', adSetId: '' }, { emitEvent: false });
        this.adSets = [];
        if (!adAccountId) {
          this.campaigns = [];
          return;
        }

        this.loadCampaigns(adAccountId);
      });

    this.form.controls.campaignId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((campaignId) => {
        this.form.controls.adSetId.setValue('', { emitEvent: false });
        if (!campaignId) {
          this.adSets = [];
          return;
        }

        this.loadAdSets(campaignId);
      });

    this.loadAccounts();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: MetaAdCreateRequest = {
      adSetId: value.adSetId,
      name: value.name.trim(),
      status: value.status,
      creativeJson: value.creativeJson,
    };

    this.isSubmitting = true;
    this.metaService
      .createMetaAd(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toastService.success({ title: 'Meta Ads', message: 'Ad creado correctamente.' });
          this.form.patchValue({ adSetId: '', name: '', creativeJson: '' });
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudo crear el ad en Meta.',
          );
        },
      });
  }

  private loadAccounts(): void {
    this.isLoadingAccounts = true;

    this.metaService
      .getMetaAdAccounts()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingAccounts = false;
        }),
      )
      .subscribe({
        next: (accounts) => {
          this.accounts = accounts;
          if (!this.form.controls.adAccountId.value && accounts.length) {
            this.form.controls.adAccountId.setValue(accounts[0].id);
          }
        },
        error: (error) => {
          this.accounts = [];
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudieron cargar las cuentas Meta.',
          );
        },
      });
  }

  private loadCampaigns(adAccountId: string): void {
    this.isLoadingCampaigns = true;

    this.metaService
      .getMetaCampaigns(adAccountId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingCampaigns = false;
        }),
      )
      .subscribe({
        next: (campaigns) => {
          this.campaigns = campaigns;
        },
        error: (error) => {
          this.campaigns = [];
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudieron cargar las campaigns Meta.',
          );
        },
      });
  }

  private loadAdSets(campaignId: string): void {
    this.isLoadingAdSets = true;

    this.adSetsService
      .getAdSets({ Page: 1, PageSize: 100, CampaignId: campaignId, SortBy: 'name' })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingAdSets = false;
        }),
      )
      .subscribe({
        next: (response: PaginatedResponse<AdSet>) => {
          this.adSets = response.items ?? [];
        },
        error: (error) => {
          this.adSets = [];
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudieron cargar ad sets para crear el ad.',
          );
        },
      });
  }
}
