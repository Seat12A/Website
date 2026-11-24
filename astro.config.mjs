// Astro configuration. The site is fully static for now (output: 'static'): Vercel builds it with `astro build`
// and serves `dist/`. When pages need the Tower API at request time (cases, chatbot), add the Vercel adapter:
// `npx astro add vercel` (see docs/deploiement.md).
import { defineConfig } from 'astro/config';

// On Vercel, the production domain is known at build time; it is used for canonical URLs and Open Graph.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: process.env.SITE_URL || (vercelHost ? `https://${vercelHost}` : undefined),
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  devToolbar: { enabled: false },
});
