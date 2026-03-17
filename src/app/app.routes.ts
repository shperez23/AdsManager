import { Routes } from '@angular/router';

import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: DashboardPageComponent,
  },
  {
    path: 'ad-accounts',
    component: DashboardPageComponent,
  },
  {
    path: 'ads',
    component: DashboardPageComponent,
  },
  {
    path: 'ad-sets',
    component: DashboardPageComponent,
  },
  {
    path: 'insights',
    component: DashboardPageComponent,
  },
];
