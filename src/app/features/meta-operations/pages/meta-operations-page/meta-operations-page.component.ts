import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { MetaService } from '../../../../core/api/services/meta.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { AdAccount } from '../../../../shared/models';
import { EmptyStateComponent } from '../../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';
import { MetaNavigationComponent } from '../../components/meta-navigation/meta-navigation.component';

@Component({
  selector: 'app-meta-operations-page',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    MetaNavigationComponent,
  ],
  templateUrl: './meta-operations-page.component.html',
})
export class MetaOperationsPageComponent implements OnInit {
  adAccounts: AdAccount[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly metaService: MetaService,
    private readonly requestFeedbackService: RequestFeedbackService,
  ) {}

  ngOnInit(): void {
    this.loadAdAccounts();
  }

  onRetry(): void {
    this.loadAdAccounts();
  }

  trackByAccount(_: number, account: AdAccount): string {
    return account.id;
  }

  private loadAdAccounts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.metaService
      .getMetaAdAccounts()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (accounts) => {
          this.adAccounts = accounts;
        },
        error: (error) => {
          this.adAccounts = [];
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudieron cargar las cuentas Meta.',
          );
        },
      });
  }
}
