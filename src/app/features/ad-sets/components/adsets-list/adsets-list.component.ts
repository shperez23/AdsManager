import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, finalize, takeUntil } from 'rxjs';

import { AdSet, PaginationResponse } from '../../../../core/api/models';
import { AdSetsService } from '../../../../core/api/services/adsets.service';

type AdSetStatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'DISABLED';

@Component({
  selector: 'app-adsets-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './adsets-list.component.html',
})
export class AdsetsListComponent implements OnInit, OnDestroy {
  readonly pageSizeOptions = [5, 10, 20, 50];
  readonly statusOptions: AdSetStatusFilter[] = ['ALL', 'ACTIVE', 'PAUSED', 'DISABLED'];

  adSets: AdSet[] = [];
  filteredAdSets: AdSet[] = [];
  paginatedAdSets: AdSet[] = [];

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
    this.applyFilters();
  }

  onPageSizeChange(pageSize: number): void {
    this.selectedPageSize = Number(pageSize);
    this.currentPage = 1;
    this.updatePagination();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.updatePagination();
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

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  trackByAdSet(_: number, adSet: AdSet): string {
    return adSet.id;
  }

  formatBudget(adSet: AdSet): number {
    return adSet.dailyBudget ?? adSet.lifetimeBudget ?? 0;
  }

  private listenToSearch(): void {
    this.searchChange$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.applyFilters();
      });
  }

  private loadAdSets(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.adSetsService
      .getAdSets()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response: PaginationResponse<AdSet>) => {
          this.adSets = response.items;
          this.applyFilters();
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar los ad sets.';
          this.adSets = [];
          this.filteredAdSets = [];
          this.paginatedAdSets = [];
          this.totalItems = 0;
          this.totalPages = 1;
        },
      });
  }

  private applyFilters(): void {
    const normalizedTerm = this.searchTerm.trim().toLowerCase();

    this.filteredAdSets = this.adSets.filter((adSet) => {
      const matchesStatus = this.selectedStatus === 'ALL' || adSet.status === this.selectedStatus;
      const matchesSearch =
        normalizedTerm.length === 0 ||
        adSet.name.toLowerCase().includes(normalizedTerm) ||
        adSet.accountId.toLowerCase().includes(normalizedTerm);

      return matchesStatus && matchesSearch;
    });

    this.totalItems = this.filteredAdSets.length;
    this.totalPages = Math.max(Math.ceil(this.totalItems / this.selectedPageSize), 1);

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.updatePagination();
  }

  private updatePagination(): void {
    const start = (this.currentPage - 1) * this.selectedPageSize;
    const end = start + this.selectedPageSize;
    this.paginatedAdSets = this.filteredAdSets.slice(start, end);
    this.totalPages = Math.max(Math.ceil(this.totalItems / this.selectedPageSize), 1);
  }
}
