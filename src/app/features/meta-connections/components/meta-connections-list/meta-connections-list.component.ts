import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MetaConnection } from '../../../../shared/models';
import { EmptyStateComponent } from '../../../../shared/ui/states/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/states/error-state.component';
import { LoadingStateComponent } from '../../../../shared/ui/states/loading-state.component';

@Component({
  selector: 'app-meta-connections-list',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent],
  templateUrl: './meta-connections-list.component.html',
})
export class MetaConnectionsListComponent {
  @Input() connections: MetaConnection[] = [];
  @Input() isLoading = false;
  @Input() errorMessage: string | null = null;
  @Input() activeActionId: string | null = null;

  @Output() retry = new EventEmitter<void>();
  @Output() edit = new EventEmitter<MetaConnection>();
  @Output() remove = new EventEmitter<MetaConnection>();
  @Output() refreshToken = new EventEmitter<MetaConnection>();
  @Output() validate = new EventEmitter<MetaConnection>();

  formatDate(value?: string | null): string {
    if (!value) {
      return '—';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleString();
  }

  isBusy(connectionId: string): boolean {
    return this.activeActionId === connectionId;
  }
}
