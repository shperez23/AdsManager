import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavigationItem {
  readonly label: string;
  readonly description: string;
  readonly route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  readonly navigationItems: NavigationItem[] = [
    { label: 'Dashboard', description: 'Overview', route: '/' },
    { label: 'Ad Accounts', description: 'Control center', route: '/ad-accounts' },
    { label: 'Ads', description: 'Creatives & status', route: '/ads' },
    { label: 'Ad Sets', description: 'Targeting layers', route: '/ad-sets' },
  ];
}
