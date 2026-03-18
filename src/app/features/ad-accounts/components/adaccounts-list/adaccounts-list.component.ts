import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, finalize } from 'rxjs';

import {
  AdAccount,
  PaginatedResponse, PaginationQueryParams, SortDirection,
} from '../../../../shared/models';
import { AdAccountsService } from '../../../../core/api/services/adaccounts.service';
import { EmptyStateComponent } from '../../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';

type SortColumn = 'name' | 'status' | 'createdAt';

@Component({
  selector: 'app-adaccounts-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent, EmptyStateComponent, ErrorStateComponent],
  templateUrl: './adaccounts-list.component.html',
})
export class AdaccountsListComponent implements OnInit, OnDestroy {
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

  private readonly destroy$ = new Subject<void>();
  private readonly searchChange$ = new Subject<string>();

  constructor(
    private readonly adAccountsService: AdAccountsService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.listenToSearch();
    this.loadAdAccounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.syncingAccountId = account.id;

    this.adAccountsService
      .syncAdAccount(account.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.syncingAccountId = null;
        }),
      )
      .subscribe({
        next: () => this.loadAdAccounts(),
        error: () => {
          this.errorMessage = 'No se pudo sincronizar la cuenta. Intenta de nuevo.';
        },
      });
  }

  onViewDetail(account: AdAccount): void {
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
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.loadAdAccounts();
      });
  }

  private loadAdAccounts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const params: PaginationQueryParams = {
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
        takeUntil(this.destroy$),
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
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar las cuentas publicitarias.';
          this.adAccounts = [];
          this.totalItems = 0;
          this.totalPages = 1;
        },
      });
  }
}
