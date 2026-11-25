/*
 * Interaction test of the filter chips of /fact-checks, against the local stand-in for Tower (tools/tower-mock.js):
 * adds a verdict filter (its editor must open by itself), ticks two verdicts, adds a type and closes it empty (the chip
 * must disappear), picks a date preset, reloads (the chips must come back from the address). Prints the addresses and
 * console errors; screenshots go to tools/captures/ (or OUT=…).
 *   node tools/filtres.js            SOMBRE=1 node tools/filtres.js
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { startTowerMock } from './tower-mock.js';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = process.env.OUT || new URL('./captures/', import.meta.url).pathname;
const mock = await startTowerMock();
process.env.TOWER_API_URL = `http://127.0.0.1:${mock.address().port}`;
const { dev } = await import('astro');
const server = await dev({ root: new URL('..', import.meta.url), logLevel: 'warn', server: { port: 4392, host: '127.0.0.1' } });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: process.env.SOMBRE ? 'dark' : 'light' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const shot = (n) => page.screenshot({ path: path.join(out, n) });
const wait = (ms) => page.waitForTimeout(ms);
await page.goto('http://127.0.0.1:4392/fact-checks', { waitUntil: 'networkidle' });
await wait(1500);
// add verdict: chip + popover open automatically
await page.getByRole('button', { name: 'Filtrer', exact: true }).click(); await wait(300);
await shot('chips-1-menu.png');
await page.getByRole('menuitem', { name: 'Verdict' }).click(); await wait(700);
await shot('chips-2-verdict-open.png');
await page.getByText('Faux', { exact: true }).last().click(); await wait(200);
await page.getByText('Trompeur', { exact: true }).last().click(); await wait(1200);
await page.keyboard.press('Escape'); await wait(600);
console.log('url after verdict:', page.url());
await shot('chips-3-verdict-set.png');
// add type then escape without value -> chip must disappear
await page.getByRole('button', { name: 'Filtrer', exact: true }).first().click(); await wait(300);
await page.getByRole('menuitem', { name: 'Type' }).click(); await wait(700);
await page.keyboard.press('Escape'); await wait(500);
console.log('type chip present after empty close:', await page.getByRole('button', { name: /^Type/ }).count());
// date preset
await page.getByRole('button', { name: 'Filtrer', exact: true }).last().click(); await wait(300);
await page.getByRole('menuitem', { name: 'Date' }).click(); await wait(700);
await shot('chips-4-date-open.png');
await page.getByRole('button', { name: '7 derniers jours' }).click(); await wait(1500);
console.log('url after date:', page.url());
await shot('chips-5-final.png');
await page.reload({ waitUntil: 'networkidle' }); await wait(1000);
await shot('chips-6-reloaded.png');
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close(); await server.stop(); mock.close();
