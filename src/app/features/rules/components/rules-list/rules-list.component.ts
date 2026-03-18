import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, finalize, takeUntil } from 'rxjs';

import { RulesService } from '../../../../core/api/services/rules.service';
import { ToastService } from '../../../../core/notifications/toast.service';
import {
  RULE_ACTION_LABELS,
  RULE_ENTITY_LEVEL_LABELS,
  RULE_METRIC_LABELS,
  RULE_OPERATOR_LABELS,
  Rule,
  RulesQueryParams,
} from '../../../../shared/models';
import { EmptyStateComponent } from '../../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';

type RuleStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'app-rules-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './rules-list.component.html',
})
export class RulesListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() reloadKey = 0;

  @Output() editRule = new EventEmitter<Rule>();

  readonly pageSizeOptions = [5, 10, 20, 50];
  readonly statusOptions: RuleStatusFilter[] = ['ALL', 'ACTIVE', 'INACTIVE'];

  rules: Rule[] = [];

  searchTerm = '';
  selectedStatus: RuleStatusFilter = 'ALL';
  selectedPageSize = 10;

  currentPage = 1;
  totalPages = 1;
  totalItems = 0;

  isLoading = false;
  actionRuleId: string | null = null;
  errorMessage: string | null = null;

  readonly entityLevelLabels = RULE_ENTITY_LEVEL_LABELS;
  readonly metricLabels = RULE_METRIC_LABELS;
  readonly operatorLabels = RULE_OPERATOR_LABELS;
  readonly actionLabels = RULE_ACTION_LABELS;

  private readonly destroy$ = new Subject<void>();
  private readonly searchChange$ = new Subject<string>();

  constructor(
    private readonly rulesService: RulesService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.listenToSearch();
    this.loadRules();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reloadKey'] && !changes['reloadKey'].firstChange) {
      this.loadRules();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchChange$.next(value);
  }

  onStatusChange(status: RuleStatusFilter): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadRules();
  }

  onPageSizeChange(pageSize: number): void {
    this.selectedPageSize = Number(pageSize);
    this.currentPage = 1;
    this.loadRules();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadRules();
  }

  onEdit(rule: Rule): void {
    this.editRule.emit(rule);
  }

  onToggleStatus(rule: Rule): void {
    this.errorMessage = null;
    this.actionRuleId = rule.id;

    const request$ = rule.isActive
      ? this.rulesService.deactivateRule(rule.id)
      : this.rulesService.activateRule(rule.id);

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.actionRuleId = null;
        }),
      )
      .subscribe({
        next: () => {
          this.toastService.success({
            title: 'Rules',
            message: rule.isActive
              ? 'Regla desactivada correctamente.'
              : 'Regla activada correctamente.',
          });
          this.loadRules();
        },
        error: () => {
          this.errorMessage = 'No se pudo actualizar el estado de la regla.';
          this.toastService.error({ title: 'Rules', message: this.errorMessage });
        },
      });
  }

  onRetry(): void {
    this.loadRules();
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  trackByRule(_: number, rule: Rule): string {
    return rule.id;
  }

  private listenToSearch(): void {
    this.searchChange$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe((term) => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.loadRules();
    });
  }

  private loadRules(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const params: RulesQueryParams = {
      Page: this.currentPage,
      PageSize: this.selectedPageSize,
      Search: this.searchTerm || undefined,
      Status: this.mapStatusFilter(this.selectedStatus),
    };

    this.rulesService
      .getRules(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.rules = response.items ?? [];
          this.currentPage = response.page || 1;
          this.totalPages = Math.max(response.totalPages || 1, 1);
          this.totalItems = response.totalItems || this.rules.length;
        },
        error: () => {
          this.rules = [];
          this.errorMessage = 'No se pudieron cargar las reglas.';
        },
      });
  }

  private mapStatusFilter(status: RuleStatusFilter): boolean | undefined {
    if (status === 'ACTIVE') {
      return true;
    }

    if (status === 'INACTIVE') {
      return false;
    }

    return undefined;
  }
}
