# AdsmanagerFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.6.

## Runtime backend configuration

The frontend no longer depends on a hardcoded backend URL at build time. The API base is resolved using this order of precedence:

1. `window.__APP_CONFIG__` loaded from `/app-config.js`.
2. Server environment variables (`ADSMANAGER_API_URL` and `ADSMANAGER_API_VERSION`) when running the Angular SSR server.
3. Angular environment defaults from `src/environments/environment.ts` or `src/environments/environment.prod.ts`.

### Change the backend URL without rebuilding

#### Option 1: edit the external config file

Update `public/app-config.js` before building, or replace `dist/adsmanager-frontend/browser/app-config.js` after building/deploying:

```js
window.__APP_CONFIG__ = {
  apiUrl: 'https://api.my-company.com',
  apiVersion: 'v2',
};
```

This is the recommended option for static hosting because it lets you point the same bundle to a different backend without recompiling Angular.

#### Option 2: override through environment variables

When using the SSR Node server, set environment variables before starting the server:

```bash
export ADSMANAGER_API_URL="https://api.my-company.com"
export ADSMANAGER_API_VERSION="v2"
npm run build
node dist/adsmanager-frontend/server/server.mjs
```

The server exposes `/app-config.js` dynamically, so each deployment can inject the backend URL at runtime without changing the compiled frontend assets.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
