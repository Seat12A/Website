// Astro configuration. Pages are static by default (`output: 'static'`); the pages that read the Tower API at request
// time (fact-checks, post lookup) opt out with `export const prerender = false` and run as Vercel functions, cached by
// Vercel's CDN for 5 minutes (see src/lib/tower.js and docs/deploiement.md).
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// On Vercel, the production domain is known at build time; it is used for canonical URLs and Open Graph.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: process.env.SITE_URL || (vercelHost ? `https://${vercelHost}` : undefined),
  output: 'static',
  adapter: vercel(),
  // React + Tailwind only for the shadcn/ui components of the pages other than the home page (src/components/ui).
  // They are rendered on the server: no React is sent to the browser unless a component asks for client:*.
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  trailingSlash: 'never',
  devToolbar: { enabled: false },
});
