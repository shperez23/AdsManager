import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  CreateRuleRequest,
  RULE_ACTION_OPTIONS,
  RULE_ENTITY_LEVEL_OPTIONS,
  RULE_METRIC_OPTIONS,
  RULE_OPERATOR_OPTIONS,
  Rule,
  RuleAction,
  RuleEntityLevel,
  RuleMetric,
  RuleOperator,
  UpdateRuleRequest,
} from '../../../../shared/models';

export interface RuleFormSubmitEvent {
  mode: 'create' | 'edit';
  value: CreateRuleRequest | UpdateRuleRequest;
}

@Component({
  selector: 'app-rules-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rules-form.component.html',
})
export class RulesFormComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);

  @Input() rule: Rule | null = null;
  @Input() isSubmitting = false;

  @Output() cancelEdit = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<RuleFormSubmitEvent>();

  readonly entityLevelOptions = RULE_ENTITY_LEVEL_OPTIONS;
  readonly metricOptions = RULE_METRIC_OPTIONS;
  readonly operatorOptions = RULE_OPERATOR_OPTIONS;
  readonly actionOptions = RULE_ACTION_OPTIONS;

  readonly form = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(120),
    ]),
    entityLevel: this.formBuilder.nonNullable.control<RuleEntityLevel>(RuleEntityLevel.Campaign, [
      Validators.required,
    ]),
    metric: this.formBuilder.nonNullable.control<RuleMetric>(RuleMetric.Ctr, [Validators.required]),
    operator: this.formBuilder.nonNullable.control<RuleOperator>(RuleOperator.GreaterThan, [
      Validators.required,
    ]),
    threshold: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0.01)]),
    action: this.formBuilder.nonNullable.control<RuleAction>(RuleAction.Pause, [
      Validators.required,
    ]),
    isActive: this.formBuilder.nonNullable.control(true),
  });

  get isEditMode(): boolean {
    return !!this.rule;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['rule']) {
      return;
    }

    this.form.reset({
      name: this.rule?.name ?? '',
      entityLevel: this.rule?.entityLevel ?? RuleEntityLevel.Campaign,
      metric: this.rule?.metric ?? RuleMetric.Ctr,
      operator: this.rule?.operator ?? RuleOperator.GreaterThan,
      threshold: this.rule?.threshold ?? 0,
      action: this.rule?.action ?? RuleAction.Pause,
      isActive: this.rule?.isActive ?? true,
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      name: value.name.trim(),
      entityLevel: value.entityLevel,
      metric: value.metric,
      operator: value.operator,
      threshold: Number(value.threshold),
      action: value.action,
      isActive: value.isActive,
    };

    this.submitForm.emit({
      mode: this.isEditMode ? 'edit' : 'create',
      value: payload,
    });
  }

  onCancel(): void {
    this.cancelEdit.emit();
  }

  hasError(controlName: keyof typeof this.form.controls, errorCode: string): boolean {
    const control = this.form.controls[controlName];
    return !!control && control.touched && control.hasError(errorCode);
  }
}
