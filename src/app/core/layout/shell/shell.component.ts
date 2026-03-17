import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ToastContainerComponent } from '../../../shared/ui/toast/toast-container.component';

interface NavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  readonly navigationItems: NavigationItem[] = [
    { label: 'Dashboard', route: '/', icon: '🏠' },
    { label: 'Ad Accounts', route: '/ad-accounts', icon: '🧾' },
    { label: 'Ads', route: '/ads', icon: '📣' },
    { label: 'Ad Sets', route: '/ad-sets', icon: '🎯' },
    { label: 'Campaigns', route: '/campaigns', icon: '🧠' },
    { label: 'Insights', route: '/insights', icon: '📊' },
  ];
}
