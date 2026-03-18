import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { RulesService } from '../../../core/api/services/rules.service';
import { RequestFeedbackService } from '../../../core/errors/request-feedback.service';
import { ToastService } from '../../../core/notifications/toast.service';
import { CreateRuleRequest, Rule, UpdateRuleRequest } from '../../../shared/models';
import { RuleFormSubmitEvent, RulesFormComponent } from '../components/rules-form/rules-form.component';
import { RulesListComponent } from '../components/rules-list/rules-list.component';

@Component({
  selector: 'app-rules-page',
  standalone: true,
  imports: [CommonModule, RulesFormComponent, RulesListComponent],
  templateUrl: './rules-page.component.html',
})
export class RulesPageComponent {
  selectedRule: Rule | null = null;
  isSubmitting = false;
  reloadKey = 0;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly rulesService: RulesService,
    private readonly requestFeedbackService: RequestFeedbackService,
    private readonly toastService: ToastService,
  ) {}

  onEditRule(rule: Rule): void {
    this.selectedRule = rule;
  }

  onCancelEdit(): void {
    this.selectedRule = null;
  }

  onSubmit(event: RuleFormSubmitEvent): void {
    this.isSubmitting = true;

    const request$ =
      event.mode === 'edit' && this.selectedRule
        ? this.rulesService.updateRule(this.selectedRule.id, event.value as UpdateRuleRequest)
        : this.rulesService.createRule(event.value as CreateRuleRequest);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isSubmitting = false)),
      )
      .subscribe({
        next: () => {
          this.selectedRule = null;
          this.reloadKey += 1;
          this.toastService.success({
            title: 'Rules',
            message:
              event.mode === 'edit'
                ? 'Regla actualizada correctamente.'
                : 'Regla creada correctamente.',
          });
        },
        error: (error) => {
          this.requestFeedbackService.showError(
            'Rules',
            error,
            event.mode === 'edit'
              ? 'No se pudo actualizar la regla.'
              : 'No se pudo crear la regla.',
          );
        },
      });
  }
}
