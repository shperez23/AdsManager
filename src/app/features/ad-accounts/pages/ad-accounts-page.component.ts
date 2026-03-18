import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { AdAccountsService } from '../../../core/api/services/adaccounts.service';
import { RequestFeedbackService } from '../../../core/errors/request-feedback.service';
import { ToastService } from '../../../core/notifications/toast.service';
import { AdAccount } from '../../../shared/models';
import { AdaccountDetailComponent } from '../components/adaccount-detail/adaccount-detail.component';
import { AdaccountsListComponent } from '../components/adaccounts-list/adaccounts-list.component';

@Component({
  selector: 'app-ad-accounts-page',
  standalone: true,
  imports: [CommonModule, AdaccountsListComponent, AdaccountDetailComponent],
  templateUrl: './ad-accounts-page.component.html',
})
export class AdAccountsPageComponent implements OnInit {
  selectedAdAccountId: string | null = null;
  selectedAdAccount: AdAccount | null = null;
  isImporting = false;
  reloadKey = 0;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly adAccountsService: AdAccountsService,
    private readonly requestFeedbackService: RequestFeedbackService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.selectedAdAccountId = params.get('id');

      if (!this.selectedAdAccountId) {
        this.selectedAdAccount = null;
      }
    });
  }

  onSelectedAdAccountChange(adAccount: AdAccount | null): void {
    this.selectedAdAccount = adAccount;
  }

  onImportFromMeta(): void {
    if (this.isImporting) {
      return;
    }

    this.isImporting = true;

    this.adAccountsService
      .importFromMeta()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isImporting = false)),
      )
      .subscribe({
        next: () => {
          this.toastService.success({
            title: 'Cuentas publicitarias',
            message: 'Importación desde Meta iniciada correctamente.',
          });
          this.reloadKey += 1;
        },
        error: (error) => {
          this.requestFeedbackService.showError(
            'Cuentas publicitarias',
            error,
            'No se pudo iniciar la importación desde Meta.',
          );
        },
      });
  }
}
