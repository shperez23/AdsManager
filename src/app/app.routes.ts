import { Routes } from '@angular/router';

import { authGuard } from './core/auth/guards/auth.guard';
import { guestGuard } from './core/auth/guards/guest.guard';
import { ShellComponent } from './core/layout/shell/shell.component';
import { LoginPageComponent } from './features/auth/pages/login-page.component';
import { RegisterPageComponent } from './features/auth/pages/register-page.component';
import { AdAccountsPageComponent } from './features/ad-accounts/pages/ad-accounts-page.component';
import { AdSetsPageComponent } from './features/ad-sets/pages/ad-sets-page.component';
import { AdsPageComponent } from './features/ads/pages/ads-page.component';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page.component';
import { CampaignsPageComponent } from './features/campaigns/pages/campaigns-page.component';
import { InsightsPageComponent } from './features/insights/pages/insights-page.component';
import { MetaConnectionsPageComponent } from './features/meta-connections/pages/meta-connections-page.component';
import { MetaAdSetsPageComponent } from './features/meta-operations/pages/meta-adsets-page/meta-adsets-page.component';
import { MetaAdsPageComponent } from './features/meta-operations/pages/meta-ads-page/meta-ads-page.component';
import { MetaCampaignsPageComponent } from './features/meta-operations/pages/meta-campaigns-page/meta-campaigns-page.component';
import { MetaInsightsPageComponent } from './features/meta-operations/pages/meta-insights-page/meta-insights-page.component';
import { MetaOperationsPageComponent } from './features/meta-operations/pages/meta-operations-page/meta-operations-page.component';
import { RulesPageComponent } from './features/rules/pages/rules-page.component';
import { ReportsPageComponent } from './features/reports/pages/reports-page.component';

export const appRoutes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    component: LoginPageComponent,
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    component: RegisterPageComponent,
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
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
        path: 'reports',
        component: ReportsPageComponent,
      },
      {
        path: 'meta-connections',
        component: MetaConnectionsPageComponent,
      },
      {
        path: 'meta/operations',
        component: MetaOperationsPageComponent,
      },
      {
        path: 'meta/campaigns',
        component: MetaCampaignsPageComponent,
      },
      {
        path: 'meta/adsets',
        component: MetaAdSetsPageComponent,
      },
      {
        path: 'meta/ads',
        component: MetaAdsPageComponent,
      },
      {
        path: 'meta/insights',
        component: MetaInsightsPageComponent,
      },
      {
        path: 'rules',
        component: RulesPageComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
