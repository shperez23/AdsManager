import { RenderMode, ServerRoute } from '@angular/ssr';

const privateClientOnlyRoutes = [
  '',
  'ad-accounts',
  'ads',
  'ad-sets',
  'campaigns',
  'insights',
  'reports',
  'meta-connections',
  'rules',
];

const clientOnlyServerRoutes: ServerRoute[] = privateClientOnlyRoutes.map((path) => ({
  path,
  renderMode: RenderMode.Client,
}));

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'register',
    renderMode: RenderMode.Prerender,
  },
  ...clientOnlyServerRoutes,
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
