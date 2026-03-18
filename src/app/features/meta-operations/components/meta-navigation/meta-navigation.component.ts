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
      label: 'Operaciones',
      route: '/meta/operations',
      description: 'Cuentas Meta y accesos rápidos.',
    },
    {
      label: 'Campañas',
      route: '/meta/campaigns',
      description: 'Listado, creación y cambio de estado.',
    },
    {
      label: 'Conjuntos',
      route: '/meta/adsets',
      description: 'Creación de conjuntos de anuncios desde la interfaz.',
    },
    {
      label: 'Anuncios',
      route: '/meta/ads',
      description: 'Creación de anuncios sin IDs manuales.',
    },
    {
      label: 'Métricas',
      route: '/meta/insights',
      description: 'Panel básico por cuenta.',
    },
  ];
}
