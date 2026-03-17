import { Routes } from '@angular/router';

import { AdAccountsPageComponent } from './features/ad-accounts/pages/ad-accounts-page.component';
import { AdSetsPageComponent } from './features/ad-sets/pages/ad-sets-page.component';
import { AdsPageComponent } from './features/ads/pages/ads-page.component';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: DashboardPageComponent,
  },
  {
    path: 'ad-accounts',
    component: AdAccountsPageComponent,
  },
  {
    path: 'ads',
    component: AdsPageComponent,
  },
  {
    path: 'ad-sets',
    component: AdSetsPageComponent,
  },
  {
    path: 'insights',
    component: AdsPageComponent,
  },
];
