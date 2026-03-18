import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  CreateMetaConnectionRequest,
  MetaConnection,
  MetaConnectionMutationRequest,
  UpdateMetaConnectionRequest,
} from '../../../../shared/models';

interface MetaConnectionFormValue {
  appId: string;
  appSecret: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiration: string;
  businessId: string;
}

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

    this.form.reset(this.createFormValue(this.connection));
  }

  onCancel(): void {
    this.cancelEdit.emit();
  }

  onSubmit(): void {
    this.submitForm.emit({
      mode: this.isEditMode ? 'edit' : 'create',
      value: this.toRequestPayload(this.form.getRawValue()),
    });
  }

  private createFormValue(connection: MetaConnection | null): MetaConnectionFormValue {
    return {
      appId: connection?.appId ?? '',
      appSecret: connection?.appSecret ?? '',
      accessToken: connection?.accessToken ?? '',
      refreshToken: connection?.refreshToken ?? '',
      tokenExpiration: this.toDateTimeLocal(connection?.tokenExpiration),
      businessId: connection?.businessId ?? '',
    };
  }

  private toRequestPayload(value: MetaConnectionFormValue): MetaConnectionMutationRequest {
    return this.omitUndefined({
      appId: this.asOptional(value.appId),
      appSecret: this.asOptional(value.appSecret),
      accessToken: this.asOptional(value.accessToken),
      refreshToken: this.asOptional(value.refreshToken),
      tokenExpiration: this.asOptionalDate(value.tokenExpiration),
      businessId: this.asOptional(value.businessId),
    });
  }

  private toDateTimeLocal(value?: string | null): string {
    if (!value) {
      return '';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    const timezoneOffsetInMilliseconds = parsedDate.getTimezoneOffset() * 60_000;
    return new Date(parsedDate.getTime() - timezoneOffsetInMilliseconds).toISOString().slice(0, 16);
  }

  private asOptional(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private asOptionalDate(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsedDate = new Date(trimmed);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString();
  }

  private omitUndefined<T extends Record<string, string | undefined>>(value: T): T {
    return Object.entries(value).reduce((accumulator, [key, fieldValue]) => {
      if (fieldValue !== undefined) {
        accumulator[key as keyof T] = fieldValue as T[keyof T];
      }

      return accumulator;
    }, {} as T);
  }
}
