import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface MetaRouteLink {
  label: string;
  route: string;
  description: string;
}

@Component({
  selector: 'app-meta-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './meta-navigation.component.html',
})
export class MetaNavigationComponent {
  readonly links: MetaRouteLink[] = [
    {
      label: 'Operations',
      route: '/meta/operations',
      description: 'Cuentas Meta y accesos rápidos.',
    },
    {
      label: 'Campaigns',
      route: '/meta/campaigns',
      description: 'Listado, creación y cambio de estado.',
    },
    {
      label: 'AdSets',
      route: '/meta/adsets',
      description: 'Creación de ad sets desde UI.',
    },
    {
      label: 'Ads',
      route: '/meta/ads',
      description: 'Creación de ads sin IDs manuales.',
    },
    {
      label: 'Insights',
      route: '/meta/insights',
      description: 'Dashboard básico por cuenta.',
    },
  ];
}
