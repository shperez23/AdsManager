import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { MetaService } from '../../../../core/api/services/meta.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { ToastService } from '../../../../core/notifications/toast.service';
import { AdAccount, MetaAdSetCreateRequest, MetaCampaign } from '../../../../shared/models';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';
import { MetaNavigationComponent } from '../../components/meta-navigation/meta-navigation.component';

type MetaAdSetFormGroup = FormGroup<{
  adAccountId: FormControl<string>;
  campaignId: FormControl<string>;
  name: FormControl<string>;
  status: FormControl<string>;
  dailyBudget: FormControl<number | null>;
  billingEvent: FormControl<string>;
  optimizationGoal: FormControl<string>;
  targetingJson: FormControl<string>;
}>;

@Component({
  selector: 'app-meta-adsets-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ErrorStateComponent,
    LoadingStateComponent,
    MetaNavigationComponent,
  ],
  templateUrl: './meta-adsets-page.component.html',
})
export class MetaAdSetsPageComponent implements OnInit {
  readonly form: MetaAdSetFormGroup = new FormGroup({
    adAccountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    campaignId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl('ACTIVE', { nonNullable: true }),
    dailyBudget: new FormControl<number | null>(null),
    billingEvent: new FormControl('', { nonNullable: true }),
    optimizationGoal: new FormControl('', { nonNullable: true }),
    targetingJson: new FormControl('', { nonNullable: true }),
  });

  accounts: AdAccount[] = [];
  campaigns: MetaCampaign[] = [];
  isLoadingAccounts = false;
  isLoadingCampaigns = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly metaService: MetaService,
    private readonly requestFeedbackService: RequestFeedbackService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.form.controls.adAccountId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((adAccountId) => {
        this.form.controls.campaignId.setValue('', { emitEvent: false });
        if (!adAccountId) {
          this.campaigns = [];
          return;
        }

        this.loadCampaigns(adAccountId);
      });

    this.loadAccounts();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: MetaAdSetCreateRequest = {
      campaignId: value.campaignId,
      name: value.name.trim(),
      status: value.status,
      dailyBudget: value.dailyBudget ?? undefined,
      billingEvent: value.billingEvent || undefined,
      optimizationGoal: value.optimizationGoal || undefined,
      targetingJson: value.targetingJson || undefined,
    };

    this.isSubmitting = true;
    this.metaService
      .createMetaAdSet(value.adAccountId, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toastService.success({
            title: 'Meta AdSets',
            message: 'AdSet creado correctamente.',
          });
          this.form.patchValue({
            campaignId: '',
            name: '',
            dailyBudget: null,
            billingEvent: '',
            optimizationGoal: '',
            targetingJson: '',
          });
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudo crear el ad set de Meta.',
          );
        },
      });
  }

  private loadAccounts(): void {
    this.isLoadingAccounts = true;
    this.errorMessage = null;

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
            'No se pudieron cargar las campaigns Meta para crear el ad set.',
          );
        },
      });
  }
}
