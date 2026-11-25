/*
 * Screenshots of the home page at chosen points of the flight, to check a visual change.
 * Serves the built site (dist/) on a local port, so run `npm run build` first.
 *
 * Usage:
 *   npm run build && node tools/captures.js            # default points, 1280×800
 *   node tools/captures.js 0 0.2 0.55 1                # chosen points (0 = on the ground, 1 = arrival)
 *   LARGEUR=390 HAUTEUR=844 node tools/captures.js 0 0.55   # phone size
 *
 * Images go to tools/captures/ (ignored by git). WebGL runs on SwiftShader (software): slow but faithful.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../dist');
const out = path.resolve(here, 'captures');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html is missing: run `npm run build` first.');
  process.exit(1);
}

const points = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const flight = points.length ? points : [0, 0.1, 0.16, 0.265, 0.42, 0.55, 0.64, 0.73, 0.82, 0.9, 1];
const width = Number(process.env.LARGEUR || 1280), height = Number(process.env.HAUTEUR || 800);
fs.mkdirSync(out, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(dist, url === '/' ? 'index.html' : url);
  if (!file.startsWith(dist) || !fs.existsSync(file)) file = path.join(dist, '404.html');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width, height } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(base);
await page.waitForTimeout(1500);
/* wait for the window blind of the arrival to be gone (intro.js) */
await page.waitForFunction(() => !document.getElementById('intro'), null, { timeout: 60000 });
for (const f of flight) {
  await page.evaluate((x) => window.seat12a.goTo(x), f);
  await page.waitForTimeout(700);
  const name = `vol-${String(f).replace('.', '_')}.png`;
  await page.screenshot({ path: path.join(out, name) });
  console.log('capturé', name);
}
console.log(errors.length ? 'erreurs : ' + errors.join(' | ') : 'aucune erreur');
await browser.close();
server.close();
