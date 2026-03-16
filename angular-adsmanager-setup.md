# Guía de arranque: Angular 17+ + Tailwind para AdsManager

> Contexto detectado: el repositorio actual no contiene una base Angular existente (solo `.gitkeep`), por lo que se propone un **bootstrap moderno** con arquitectura escalable orientada a SaaS y APIs REST.

## 1) Comandos CLI para crear el proyecto

```bash
# 1) Crear workspace Angular moderno con routing y SCSS
npx @angular/cli@latest new ads-manager-web \
  --style=scss \
  --routing \
  --standalone \
  --ssr=false

cd ads-manager-web

# 2) Dependencias útiles enterprise para APIs REST y estado de request
npm i axios
npm i zod

# (opcional) utilidades de DX
npm i -D @types/node
```

### Estructura recomendada (SaaS escalable)

```text
src/app/
  core/                  # singleton services, interceptors, guards, config
    api/
      api-client.service.ts
      interceptors/
        auth.interceptor.ts
        error.interceptor.ts
    config/
      app.config.ts
      env.token.ts
  shared/                # UI reutilizable y utilidades cross-feature
    ui/
      button/
      card/
      table/
    pipes/
    directives/
    models/
  features/              # vertical slices por dominio funcional
    ads/
      pages/
      components/
      services/
      models/
    campaigns/
    auth/
  layout/
    shell/
    topbar/
    sidebar/
```

## 2) Instalación de TailwindCSS

```bash
# Tailwind v3 estable para Angular 17+
npm i -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init
```

> Si deseas Tailwind v4, la integración cambia (sin `tailwind.config.js` clásico). Como pediste explícitamente ese archivo, se sugiere v3.

## 3) Configuración `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bcdcfe',
          300: '#8ec4fd',
          400: '#58a2fb',
          500: '#2f82f7',
          600: '#1965eb',
          700: '#1450d7',
          800: '#1842ae',
          900: '#1a3b89',
        },
      },
      boxShadow: {
        soft: '0 8px 24px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
};
```

## 4) Configuración global `styles.css` (o `styles.scss`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body {
    @apply h-full bg-slate-50 text-slate-800;
  }

  body {
    @apply antialiased;
  }
}

@layer components {
  .card {
    @apply rounded-xl2 bg-white p-6 shadow-soft border border-slate-200;
  }

  .btn-primary {
    @apply inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2;
  }

  .page-title {
    @apply text-2xl font-semibold tracking-tight text-slate-900;
  }
}
```

## 5) Ejemplo de layout base con Tailwind

### `app.component.html`

```html
<div class="min-h-screen bg-slate-50">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        <div class="h-8 w-8 rounded-lg bg-brand-600"></div>
        <span class="text-sm font-semibold uppercase tracking-wider text-slate-900">
          AdsManager
        </span>
      </div>

      <button class="btn-primary">Nuevo anuncio</button>
    </div>
  </header>

  <div class="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
    <aside class="card h-fit">
      <p class="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Navegación</p>
      <nav class="space-y-2 text-sm">
        <a class="block rounded-md bg-brand-50 px-3 py-2 font-medium text-brand-700" href="#">Dashboard</a>
        <a class="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href="#">Anuncios</a>
        <a class="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href="#">Campañas</a>
        <a class="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href="#">Reportes</a>
      </nav>
    </aside>

    <main class="space-y-6">
      <section class="card">
        <h1 class="page-title">Panel principal</h1>
        <p class="mt-2 text-sm text-slate-600">
          Vista base para una plataforma SaaS de gestión publicitaria conectada a AdsManager REST API.
        </p>
      </section>

      <section class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article class="card">
          <p class="text-sm text-slate-500">Anuncios activos</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">128</p>
        </article>

        <article class="card">
          <p class="text-sm text-slate-500">CTR promedio</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">3.42%</p>
        </article>

        <article class="card">
          <p class="text-sm text-slate-500">Costo diario</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">$1,240</p>
        </article>
      </section>
    </main>
  </div>
</div>
```

## Prácticas enterprise recomendadas para REST

- **Interceptors en `core/api/interceptors`** para:
  - auth token
  - trazabilidad (correlation-id)
  - manejo de errores homogéneo
  - retry/backoff selectivo
- **DTOs + validación con Zod** antes de mapear a modelos de dominio UI.
- **Feature-first modular**: cada dominio (`ads`, `campaigns`, etc.) encapsula páginas, componentes y servicios.
- **Shared UI sin lógica de negocio**: `shared/ui` solo componentes presentacionales reutilizables.
- **Core singleton**: clientes HTTP, guards, resolvers, configuración de entorno.

