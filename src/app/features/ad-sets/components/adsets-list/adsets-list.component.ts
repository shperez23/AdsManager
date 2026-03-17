import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, finalize, takeUntil } from 'rxjs';

import { AdSet, PaginatedResponse, PaginationQueryParams } from '../../../../shared/models';
import { AdSetsService } from '../../../../core/api/services/adsets.service';
import { EmptyStateComponent } from '../../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';

type AdSetStatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'DISABLED';

@Component({
  selector: 'app-adsets-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent, EmptyStateComponent, ErrorStateComponent],
  templateUrl: './adsets-list.component.html',
})
export class AdsetsListComponent implements OnInit, OnDestroy {
  @Output() editAdSet = new EventEmitter<AdSet>();

  readonly pageSizeOptions = [5, 10, 20, 50];
  readonly statusOptions: AdSetStatusFilter[] = ['ALL', 'ACTIVE', 'PAUSED', 'DISABLED'];

  adSets: AdSet[] = [];

  searchTerm = '';
  selectedStatus: AdSetStatusFilter = 'ALL';
  selectedPageSize = 10;

  currentPage = 1;
  totalPages = 1;
  totalItems = 0;

  isLoading = false;
  actionAdSetId: string | null = null;
  errorMessage: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly searchChange$ = new Subject<string>();

  constructor(private readonly adSetsService: AdSetsService) {}

  ngOnInit(): void {
    this.listenToSearch();
    this.loadAdSets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchChange$.next(value);
  }

  onStatusChange(status: AdSetStatusFilter): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadAdSets();
  }

  onPageSizeChange(pageSize: number): void {
    this.selectedPageSize = Number(pageSize);
    this.currentPage = 1;
    this.loadAdSets();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadAdSets();
  }

  onEdit(adSet: AdSet): void {
    this.editAdSet.emit(adSet);
  }

  onToggleStatus(adSet: AdSet): void {
    this.actionAdSetId = adSet.id;

    const request$ =
      adSet.status === 'ACTIVE'
        ? this.adSetsService.pauseAdSet(adSet.id)
        : this.adSetsService.activateAdSet(adSet.id);

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.actionAdSetId = null;
        }),
      )
      .subscribe({
        next: () => this.loadAdSets(),
        error: () => {
          this.errorMessage = 'No se pudo actualizar el estado del ad set.';
        },
      });
  }

  onRetry(): void {
    this.loadAdSets();
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  trackByAdSet(_: number, adSet: AdSet): string {
    return adSet.id;
  }

  private listenToSearch(): void {
    this.searchChange$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.loadAdSets();
      });
  }

  private loadAdSets(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const params: PaginationQueryParams = {
      Page: this.currentPage,
      PageSize: this.selectedPageSize,
      Search: this.searchTerm || undefined,
      Status: this.selectedStatus !== 'ALL' ? this.selectedStatus : undefined,
    };

    this.adSetsService
      .getAdSets(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response: PaginatedResponse<AdSet>) => {
          this.adSets = response.items;
          this.totalItems = response.totalItems;
          this.totalPages = Math.max(response.totalPages, 1);
          this.currentPage = response.page;
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar los ad sets.';
          this.adSets = [];
          this.totalItems = 0;
          this.totalPages = 1;
        },
      });
  }
}
