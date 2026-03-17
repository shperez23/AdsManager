import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavigationItem {
  readonly label: string;
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
    { label: 'Dashboard', route: '/' },
    { label: 'AdAccounts', route: '/ad-accounts' },
    { label: 'Ads', route: '/ads' },
    { label: 'AdSets', route: '/ad-sets' },
    { label: 'Insights', route: '/insights' },
  ];
}
