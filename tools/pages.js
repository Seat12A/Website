/*
 * Screenshots of the server-rendered pages (fact-checks, a post), to check a visual change. Starts `astro dev` in this
 * process, pointed at a local stand-in for Tower (tools/tower-mock.js, test data only) unless REEL=1, which reads the
 * real Tower (api.seat12a.org).
 *
 * Usage:
 *   node tools/pages.js                                  # default pages, 1280×800
 *   node tools/pages.js /fact-checks "/fact-checks?q=chômage"
 *   LARGEUR=390 HAUTEUR=844 node tools/pages.js           # phone size
 *   REEL=1 node tools/pages.js /fact-checks               # the real API
 *   PLEINE=0 ...                                         # only the first screen, not the full page
 *   SOMBRE=1 ...                                         # the computer in dark mode (light by default)
 *
 * Images go to tools/captures/ (ignored by git).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { MOCK_CASES, startTowerMock } from './tower-mock.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.resolve(here, 'captures');
fs.mkdirSync(out, { recursive: true });

let mock = null;
if (!process.env.REEL) {
  mock = await startTowerMock();
  process.env.TOWER_API_URL = `http://127.0.0.1:${mock.address().port}`;
}
const { dev } = await import('astro');
const server = await dev({ root: new URL('..', import.meta.url), logLevel: 'warn', server: { port: 4391, host: '127.0.0.1' } });
const base = 'http://127.0.0.1:4391';

const defaults = ['/fact-checks', `/fact-checks/${MOCK_CASES[0].id}`, `/post/x/${MOCK_CASES[2].post}`, '/post/x/1', '/fact-checks/00000000-0000-0000-0000-000000000000'];
const list = process.argv.slice(2).length ? process.argv.slice(2) : defaults;
const width = Number(process.env.LARGEUR || 1280), height = Number(process.env.HAUTEUR || 800);
const full = process.env.PLEINE !== '0';

const browser = await chromium.launch();
const dark = Boolean(process.env.SOMBRE);
const page = await browser.newPage({ viewport: { width, height }, colorScheme: dark ? 'dark' : 'light' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !/status of 404|status of 503/.test(m.text()) && errors.push(m.text()));
for (const p of list) {
  const res = await page.goto(base + p, { waitUntil: 'networkidle' });
  const name = `page${p.replace(/[^a-z0-9]+/gi, '-').replace(/-$/, '')}-${width}${dark ? '-sombre' : ''}.png`;
  await page.screenshot({ path: path.join(out, name), fullPage: full });
  console.log(res?.status(), name);
}
if (errors.length) console.log('Erreurs dans la console :\n' + errors.join('\n'));
await browser.close();
await server.stop();
mock?.close();
