import { Routes } from '@angular/router';

import { AdAccountsPageComponent } from './features/ad-accounts/pages/ad-accounts-page.component';
import { AdSetsPageComponent } from './features/ad-sets/pages/ad-sets-page.component';
import { AdsPageComponent } from './features/ads/pages/ads-page.component';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page.component';
import { CampaignsPageComponent } from './features/campaigns/pages/campaigns-page.component';
import { InsightsPageComponent } from './features/insights/pages/insights-page.component';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
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
    path: 'campaigns',
    component: CampaignsPageComponent,
  },
  {
    path: 'insights',
    component: InsightsPageComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
