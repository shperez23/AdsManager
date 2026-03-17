import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-6 text-slate-500">
      <span class="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></span>
      <p class="text-sm">{{ message }}</p>
    </div>
  `,
})
export class LoadingStateComponent {
  @Input() message = 'Cargando información...';
}
