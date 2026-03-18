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
    { label: 'Dashboard', route: '/', icon: '🏠' },
    { label: 'Ad Accounts', route: '/ad-accounts', icon: '🧾' },
    { label: 'Ads', route: '/ads', icon: '📣' },
    { label: 'Ad Sets', route: '/ad-sets', icon: '🎯' },
    { label: 'Campaigns', route: '/campaigns', icon: '🧠' },
    { label: 'Insights', route: '/insights', icon: '📊' },
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
