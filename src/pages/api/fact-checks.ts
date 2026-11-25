/*
 * The list of fact-checks as JSON, for the filters of /fact-checks in the browser (FactCheckBrowser.tsx). Same
 * parameters as the page, same answer as its first render (src/lib/factchecks.js). Cached like the pages.
 */
import type { APIRoute } from 'astro';
import { loadList, readFilters } from '../../lib/factchecks.js';
import { CACHE_NONE, CACHE_OK } from '../../lib/tower.js';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const list = await loadList(readFilters(url.searchParams));
  return new Response(JSON.stringify(list), {
    status: list.failed ? 503 : 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': list.failed ? CACHE_NONE : CACHE_OK },
  });
};
