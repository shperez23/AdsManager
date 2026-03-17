import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>{{ message }}</p>

        <button
          *ngIf="showRetry"
          type="button"
          class="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
          (click)="retry.emit()"
        >
          {{ retryLabel }}
        </button>
      </div>
    </div>
  `,
})
export class ErrorStateComponent {
  @Input() message = 'Ocurrió un error inesperado.';
  @Input() retryLabel = 'Reintentar';
  @Input() showRetry = false;

  @Output() retry = new EventEmitter<void>();
}
