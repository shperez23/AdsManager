import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  CreateMetaConnectionRequest,
  MetaConnection,
  UpdateMetaConnectionRequest,
} from '../../../../shared/models';

export interface MetaConnectionFormSubmitEvent {
  mode: 'create' | 'edit';
  value: CreateMetaConnectionRequest | UpdateMetaConnectionRequest;
}

@Component({
  selector: 'app-meta-connections-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './meta-connections-form.component.html',
})
export class MetaConnectionsFormComponent implements OnChanges {
  @Input() connection: MetaConnection | null = null;
  @Input() isSubmitting = false;

  @Output() cancelEdit = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<MetaConnectionFormSubmitEvent>();

  readonly form = new FormGroup({
    appId: new FormControl('', { nonNullable: true }),
    appSecret: new FormControl('', { nonNullable: true }),
    accessToken: new FormControl('', { nonNullable: true }),
    refreshToken: new FormControl('', { nonNullable: true }),
    tokenExpiration: new FormControl('', { nonNullable: true }),
    businessId: new FormControl('', { nonNullable: true }),
  });

  get isEditMode(): boolean {
    return !!this.connection;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['connection']) {
      return;
    }

    this.form.reset({
      appId: this.connection?.appId ?? '',
      appSecret: this.connection?.appSecret ?? '',
      accessToken: this.connection?.accessToken ?? '',
      refreshToken: this.connection?.refreshToken ?? '',
      tokenExpiration: this.toDateTimeLocal(this.connection?.tokenExpiration),
      businessId: this.connection?.businessId ?? '',
    });
  }

  onCancel(): void {
    this.cancelEdit.emit();
  }

  onSubmit(): void {
    const value = this.form.getRawValue();
    const payload = {
      appId: this.asOptional(value.appId),
      appSecret: this.asOptional(value.appSecret),
      accessToken: this.asOptional(value.accessToken),
      refreshToken: this.asOptional(value.refreshToken),
      tokenExpiration: this.asOptional(value.tokenExpiration),
      businessId: this.asOptional(value.businessId),
    };

    this.submitForm.emit({
      mode: this.isEditMode ? 'edit' : 'create',
      value: payload,
    });
  }

  private toDateTimeLocal(value?: string): string {
    if (!value) {
      return '';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return parsedDate.toISOString().slice(0, 16);
  }

  private asOptional(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
