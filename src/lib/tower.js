/*
 * Server-side client for the public API of 12A Tower (docs/api-tower.md). Only used in server-rendered pages: the
 * browser never calls Tower, so there is no CORS to configure for Vercel preview domains, and no token anywhere (the
 * public routes need none; a staff token would expose unpublished data, so never add one here).
 *
 * TOWER_API_URL (optional, not secret) points to another instance, e.g. a local mock: see tools/pages.js.
 *
 * Transition: the production Tower may not serve /v1/cases/search, /stats and /details yet. When those routes are
 * missing, `searchCases` and `caseDetails` fall back to the older /v1/cases routes (fewer fields, no filters) and say
 * so with `legacy: true`. Remove the fallback once every Tower in use serves the new routes.
 */

const API = (process.env.TOWER_API_URL || import.meta.env.TOWER_API_URL || 'https://api.seat12a.org').replace(/\/+$/, '');
const TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message ?? `HTTP ${status}`);
    this.status = status;
    this.code = body?.error?.code ?? null;             // stable code, e.g. "TWR-DOS-001": test this, never `message`
    this.details = body?.error?.details ?? {};
    this.requestId = body?.error?.request_id ?? null;
  }
}

/* Query string with repeated keys for arrays (?veracity=false&veracity=misleading). Empty values are skipped. */
export function query(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v == null || v === '') continue;
      qs.append(key, String(v));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function get(path, params) {
  let res;
  try {
    res = await fetch(`${API}${path}${query(params)}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw Object.assign(new ApiError(0, null), { cause: err });   // network error or timeout
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body;
}

/* A route this Tower does not serve yet: a plain 404, or /search and /stats caught by /v1/cases/{public_id}. */
function missingRoute(e) {
  if (!(e instanceof ApiError)) return false;
  if (e.code === 'TWR-GEN-002') return true;
  return e.code === 'TWR-GEN-001' && (e.details?.errors ?? []).some((x) => x.field === 'path.public_id');
}

export const isNotFound = (e) => e instanceof ApiError && (e.code === 'TWR-DOS-001' || e.code === 'TWR-GEN-001' || e.status === 404);

/* ---------- Cases ---------- */

/** Published cases matching `filters` (see §3.1). Returns the API page, plus `legacy` when filters could not apply. */
export async function searchCases(filters) {
  try {
    return { ...(await get('/v1/cases/search', filters)), legacy: false };
  } catch (e) {
    if (!missingRoute(e)) throw e;
  }
  const perPage = Number(filters.per_page) || 20, page = Math.max(1, Number(filters.page) || 1);
  const all = await get('/v1/cases', { limit: 200 });
  const items = all.map((c) => ({ ...c, url: c.x_post_id ? `https://x.com/i/status/${c.x_post_id}` : null, platform: c.x_post_id ? 'x' : null, jurisdictions: [], veracity: null, verdict_state: null, published_at: null }));
  return { items: items.slice((page - 1) * perPage, page * perPage), page, per_page: perPage, total: items.length, pages: Math.ceil(items.length / perPage), legacy: true };
}

/** Aggregated counts for the same filters (§3.3), or null when this Tower has no /stats yet. */
export async function caseStats(filters) {
  try {
    return await get('/v1/cases/stats', filters);
  } catch (e) {
    if (missingRoute(e)) return null;
    throw e;
  }
}

/** Everything for the page of a case (§3.2). Throws ApiError (see isNotFound) for an unknown or unpublished case. */
export async function caseDetails(publicId) {
  try {
    return { ...(await get(`/v1/cases/${encodeURIComponent(publicId)}/details`, { lang: 'fr' })), legacy: false };
  } catch (e) {
    if (!missingRoute(e) || e.code === 'TWR-GEN-001') throw e;
  }
  const c = await get(`/v1/cases/${encodeURIComponent(publicId)}`);
  return {
    ...c, legacy: true, claim: null, verdict: null, note: null, timeline: [], posts_count: 0, jurisdictions: [],
    content: c.x_post_id ? { platform: 'x', external_id: c.x_post_id, url: `https://x.com/i/status/${c.x_post_id}`, lang: null } : null,
  };
}

/* ---------- A post ---------- */

/** Current verdicts on a post (§4). Throws ApiError TWR-FCK-013 when the post has none. */
export function postVerdict(platform, externalId) {
  return get(`/v1/content/${encodeURIComponent(platform)}/${encodeURIComponent(externalId)}/verdict`, { lang: 'fr' });
}

/* ---------- HTTP cache for the pages that read Tower ---------- */

/* Tower answers with max-age=300: Vercel's CDN keeps the rendered page as long, and serves a stale copy while it
   renders a new one. Browsers always revalidate. Errors are never cached. */
export const CACHE_OK = 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600';
export const CACHE_NOT_FOUND = 'public, max-age=0, s-maxage=60';
export const CACHE_NONE = 'no-store';
