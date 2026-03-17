import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { ToastType } from '../../../core/notifications/toast.model';
import { ToastService } from '../../../core/notifications/toast.service';

interface ToastAppearance {
  readonly container: string;
  readonly icon: string;
  readonly iconWrapper: string;
}

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      <article
        *ngFor="let toast of toastService.toasts$ | async"
        class="pointer-events-auto overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur"
        [ngClass]="appearanceByType[toast.type].container"
      >
        <div class="flex items-start gap-3">
          <span
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
            [ngClass]="appearanceByType[toast.type].iconWrapper"
            aria-hidden="true"
          >
            {{ appearanceByType[toast.type].icon }}
          </span>

          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold">{{ toast.title }}</p>
            <p *ngIf="toast.message" class="mt-1 text-xs text-current/80">{{ toast.message }}</p>
          </div>

          <button
            type="button"
            class="rounded-md p-1 text-current/70 transition hover:bg-black/10 hover:text-current"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      </article>
    </div>
  `,
})
export class ToastContainerComponent {
  readonly appearanceByType: Record<ToastType, ToastAppearance> = {
    success: {
      container: 'border-emerald-200/60 bg-emerald-50/95 text-emerald-900',
      icon: '✓',
      iconWrapper: 'bg-emerald-200/70',
    },
    error: {
      container: 'border-rose-200/70 bg-rose-50/95 text-rose-900',
      icon: '⨯',
      iconWrapper: 'bg-rose-200/70',
    },
    warning: {
      container: 'border-amber-200/70 bg-amber-50/95 text-amber-900',
      icon: '!',
      iconWrapper: 'bg-amber-200/70',
    },
    info: {
      container: 'border-sky-200/70 bg-sky-50/95 text-sky-900',
      icon: 'i',
      iconWrapper: 'bg-sky-200/70',
    },
  };

  constructor(readonly toastService: ToastService) {}
}
