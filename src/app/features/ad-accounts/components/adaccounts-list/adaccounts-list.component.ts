import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, finalize, Subject } from 'rxjs';

import { AdAccountsService } from '../../../../core/api/services/adaccounts.service';
import { RequestFeedbackService } from '../../../../core/errors/request-feedback.service';
import { ToastService } from '../../../../core/notifications/toast.service';
import {
  AdAccount,
  AdAccountsQueryParams,
  PaginatedResponse,
  SortDirection,
} from '../../../../shared/models';
import { EmptyStateComponent } from '../../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';

type SortColumn = 'name' | 'status' | 'createdAt';

@Component({
  selector: 'app-adaccounts-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './adaccounts-list.component.html',
})
export class AdaccountsListComponent implements OnInit, OnChanges {
  readonly pageSizeOptions = [5, 10, 20, 50];
  readonly statusOptions = ['ALL', 'ACTIVE', 'PAUSED', 'DISABLED'];
  readonly sortDirection = SortDirection;

  adAccounts: AdAccount[] = [];
  searchTerm = '';
  selectedStatus = 'ALL';
  selectedPageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  sortBy: SortColumn = 'createdAt';
  currentSortDirection: SortDirection = SortDirection.Desc;
  isLoading = false;
  syncingAccountId: string | null = null;
  errorMessage: string | null = null;

  @Input() selectedAdAccountId: string | null = null;
  @Input() reloadKey = 0;

  @Output() readonly selectedAdAccountChange = new EventEmitter<AdAccount | null>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChange$ = new Subject<string>();

  constructor(
    private readonly adAccountsService: AdAccountsService,
    private readonly requestFeedbackService: RequestFeedbackService,
    private readonly router: Router,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.listenToSearch();
    this.loadAdAccounts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reloadKey'] && !changes['reloadKey'].firstChange) {
      this.loadAdAccounts();
    }

    if (changes['selectedAdAccountId'] && !changes['selectedAdAccountId'].firstChange) {
      this.emitSelectedAdAccount();
    }
  }

  onSearchChange(value: string): void {
    this.searchChange$.next(value);
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadAdAccounts();
  }

  onPageSizeChange(pageSize: number): void {
    this.selectedPageSize = Number(pageSize);
    this.currentPage = 1;
    this.loadAdAccounts();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadAdAccounts();
  }

  onSort(column: SortColumn): void {
    if (this.sortBy === column) {
      this.currentSortDirection =
        this.currentSortDirection === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc;
    } else {
      this.sortBy = column;
      this.currentSortDirection = SortDirection.Asc;
    }

    this.currentPage = 1;
    this.loadAdAccounts();
  }

  onSync(account: AdAccount): void {
    if (this.syncingAccountId) {
      return;
    }

    this.syncingAccountId = account.id;

    this.adAccountsService
      .syncAdAccount(account.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.syncingAccountId = null;
        }),
      )
      .subscribe({
        next: () => {
          this.toastService.success({
            title: 'Ad Accounts',
            message: `Sincronización iniciada para ${account.name}.`,
          });
          this.loadAdAccounts();
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudo sincronizar la cuenta. Intenta de nuevo.',
          );
          this.toastService.error({ title: 'Ad Accounts', message: this.errorMessage });
        },
      });
  }

  onViewDetail(account: AdAccount): void {
    this.selectedAdAccountChange.emit(account);
    this.router.navigate(['/ad-accounts'], { queryParams: { id: account.id } });
  }

  onRetry(): void {
    this.loadAdAccounts();
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  trackByAdAccount(_: number, adAccount: AdAccount): string {
    return adAccount.id;
  }

  getSortIcon(column: SortColumn): string {
    if (this.sortBy !== column) {
      return '↕';
    }

    return this.currentSortDirection === SortDirection.Asc ? '↑' : '↓';
  }

  private listenToSearch(): void {
    this.searchChange$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.loadAdAccounts();
      });
  }

  private loadAdAccounts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const params: AdAccountsQueryParams = {
      Page: this.currentPage,
      PageSize: this.selectedPageSize,
      Search: this.searchTerm || undefined,
      Status: this.selectedStatus !== 'ALL' ? this.selectedStatus : undefined,
      SortBy: this.sortBy,
      SortDirection: this.currentSortDirection,
    };

    this.adAccountsService
      .getAdAccounts(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response: PaginatedResponse<AdAccount>) => {
          this.adAccounts = response.items;
          this.currentPage = response.page;
          this.totalPages = Math.max(response.totalPages, 1);
          this.totalItems = response.totalItems;
          this.emitSelectedAdAccount();
        },
        error: (error) => {
          this.errorMessage = this.requestFeedbackService.resolveMessage(
            error,
            'No se pudieron cargar las cuentas publicitarias.',
          );
          this.adAccounts = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.selectedAdAccountChange.emit(null);
        },
      });
  }

  private emitSelectedAdAccount(): void {
    if (!this.selectedAdAccountId) {
      this.selectedAdAccountChange.emit(null);
      return;
    }

    const selectedAdAccount =
      this.adAccounts.find((item) => item.id === this.selectedAdAccountId) ?? null;
    this.selectedAdAccountChange.emit(selectedAdAccount);
  }
}
