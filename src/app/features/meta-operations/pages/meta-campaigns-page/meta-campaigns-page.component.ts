import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { MetaService } from '../../../../core/api/services/meta.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { ToastService } from '../../../../core/notifications/toast.service';
import {
  AdAccount,
  MetaCampaign,
  MetaCampaignCreateRequest,
  MetaCampaignStatusUpdateRequest,
} from '../../../../shared/models';
import { EmptyStateComponent } from '../../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';
import { MetaNavigationComponent } from '../../components/meta-navigation/meta-navigation.component';

type CampaignFormGroup = FormGroup<{
  adAccountId: FormControl<string>;
  name: FormControl<string>;
  objective: FormControl<string>;
  status: FormControl<string>;
  dailyBudget: FormControl<number | null>;
  lifetimeBudget: FormControl<number | null>;
}>;

@Component({
  selector: 'app-meta-campaigns-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    MetaNavigationComponent,
  ],
  templateUrl: './meta-campaigns-page.component.html',
})
export class MetaCampaignsPageComponent implements OnInit {
  readonly form: CampaignFormGroup = new FormGroup({
    adAccountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    objective: new FormControl('', { nonNullable: true }),
    status: new FormControl('ACTIVE', { nonNullable: true, validators: [Validators.required] }),
    dailyBudget: new FormControl<number | null>(null),
    lifetimeBudget: new FormControl<number | null>(null),
  });

  accounts: AdAccount[] = [];
  campaigns: MetaCampaign[] = [];
  isLoadingAccounts = false;
  isLoadingCampaigns = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  readonly statusOptions = ['ACTIVE', 'PAUSED'];

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
    const payload: MetaCampaignCreateRequest = {
      name: value.name.trim(),
      objective: value.objective || undefined,
      status: value.status,
      dailyBudget: value.dailyBudget ?? undefined,
      lifetimeBudget: value.lifetimeBudget ?? undefined,
    };

    this.isSubmitting = true;
    this.metaService
      .createMetaCampaign(value.adAccountId, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toastService.success({
            title: 'Campañas Meta',
            message: 'Campaña creada correctamente.',
          });
          this.form.patchValue({
            name: '',
            objective: '',
            dailyBudget: null,
            lifetimeBudget: null,
          });
          this.loadCampaigns(value.adAccountId);
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudo crear la campaña de Meta.',
          );
        },
      });
  }

  onStatusChange(campaignId: string, status: string): void {
    const payload: MetaCampaignStatusUpdateRequest = { campaignId, status };

    this.metaService
      .updateMetaCampaignStatus(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const adAccountId = this.form.controls.adAccountId.value;
          this.toastService.success({
            title: 'Campañas Meta',
            message: 'Estado actualizado correctamente.',
          });
          if (adAccountId) {
            this.loadCampaigns(adAccountId);
          }
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudo actualizar el estado de la campaña.',
          );
        },
      });
  }

  onRetry(): void {
    const adAccountId = this.form.controls.adAccountId.value;
    if (adAccountId) {
      this.loadCampaigns(adAccountId);
      return;
    }

    this.loadAccounts();
  }

  trackByCampaign(_: number, campaign: MetaCampaign): string {
    return campaign.id;
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
    this.errorMessage = null;

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
            'No se pudieron cargar las campañas de Meta.',
          );
        },
      });
  }
}
