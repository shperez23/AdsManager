import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">📭</span>
      <p class="text-sm font-medium text-slate-700">{{ title }}</p>
      <p class="text-xs text-slate-500">{{ description }}</p>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = 'Sin resultados';
  @Input() description = 'No encontramos datos para mostrar con los filtros actuales.';
}
