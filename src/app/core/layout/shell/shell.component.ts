import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { AuthSessionService } from '../../auth/services/auth-session.service';

interface NavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private readonly authSessionService = inject(AuthSessionService);

  readonly navigationItems: NavigationItem[] = [
    { label: 'Panel', route: '/', icon: '🏠' },
    { label: 'Cuentas publicitarias', route: '/ad-accounts', icon: '🧾' },
    { label: 'Anuncios', route: '/ads', icon: '📣' },
    { label: 'Conjuntos de anuncios', route: '/ad-sets', icon: '🎯' },
    { label: 'Campañas', route: '/campaigns', icon: '🧠' },
    { label: 'Métricas', route: '/insights', icon: '📊' },
    { label: 'Reportes', route: '/reports', icon: '📈' },
    { label: 'Conexiones Meta', route: '/meta-connections', icon: '🔗' },
    { label: 'Operaciones Meta', route: '/meta/operations', icon: '🧩' },
    { label: 'Campañas Meta', route: '/meta/campaigns', icon: '🚀' },
    { label: 'Conjuntos Meta', route: '/meta/adsets', icon: '🧱' },
    { label: 'Anuncios Meta', route: '/meta/ads', icon: '🎨' },
    { label: 'Métricas Meta', route: '/meta/insights', icon: '📡' },
    { label: 'Reglas', route: '/rules', icon: '⚙️' },
  ];

  readonly userInitials$ = this.authSessionService.user$.pipe(
    map((user) => {
      const fullName = user?.fullName?.trim();
      if (!fullName) {
        return 'US';
      }

      const tokens = fullName.split(' ').filter(Boolean);
      return tokens
        .slice(0, 2)
        .map((token) => token[0]?.toUpperCase() ?? '')
        .join('');
    }),
  );

  readonly userDisplayName$ = this.authSessionService.user$.pipe(
    map((user) => user?.fullName || user?.email || 'Usuario'),
  );

  onLogout(): void {
    this.authSessionService.logout();
  }
}
