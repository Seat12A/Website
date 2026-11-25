/*
 * The list of fact-checks, on the server: reads the filters from a URL, asks Tower (search + stats), returns what the
 * list shows. Used by the page /fact-checks (first render) and by /api/fact-checks (each filter change in the browser),
 * so both always agree. The browser never calls Tower itself (docs/fact-checks.md).
 *
 * Filters in the address (docs/fact-checks.md): q, veracity (repeated), claim_type, jurisdiction, date (a preset) or
 * since/until (AAAA-MM-JJ, both days included), sort, page. Unknown values are dropped before the call (no 422).
 * Their order in the address is the order of the chips.
 */
import { ApiError, caseStats, searchCases } from './tower.js';
import { CLAIM_TYPES, VERACITY, jurisdiction } from './labels.js';

export const PER_PAGE = 20;
export const MAX_PAGE = 500;                                       // (page - 1) × per_page must stay under 10 000
export const DATE_PRESETS = ['today', 'yesterday', 'thisWeek', 'last7', 'last30', 'thisMonth'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The filters of a URL, cleaned. `order` lists the filter keys in the order they appear in the address. */
export function readFilters(params) {
  const q = (params.get('q') ?? '').trim().replace(/\s+/g, ' ').slice(0, 200);
  const veracity = [...new Set(params.getAll('veracity'))].filter((v) => v in VERACITY);
  const claimType = (params.get('claim_type') ?? '') in CLAIM_TYPES ? params.get('claim_type') : '';
  const juris = /^[A-Za-z]{2,3}$/.test(params.get('jurisdiction') ?? '') ? params.get('jurisdiction').toUpperCase() : '';
  const datePreset = DATE_PRESETS.includes(params.get('date') ?? '') ? params.get('date') : '';
  const since = !datePreset && DAY.test(params.get('since') ?? '') ? params.get('since') : '';
  const until = !datePreset && DAY.test(params.get('until') ?? '') ? params.get('until') : '';
  const defaultSort = q ? 'relevance' : 'newest';
  const sort = ['newest', 'oldest', 'relevance'].includes(params.get('sort') ?? '') ? params.get('sort') : defaultSort;
  const page = Math.min(MAX_PAGE, Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1));

  const keyOf = { veracity: 'veracity', claim_type: 'type', jurisdiction: 'country', date: 'date', since: 'date', until: 'date' };
  const present = { veracity: veracity.length > 0, type: !!claimType, country: !!juris, date: !!(datePreset || since || until) };
  const order = [];
  for (const k of params.keys()) { const key = keyOf[k]; if (key && present[key] && !order.includes(key)) order.push(key); }

  return { q, veracity, claimType, juris, datePreset, since, until, sort, page, order };
}

/* Today's date in Paris, as AAAA-MM-JJ, shifted by `days`. */
function parisDay(days = 0) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
const nextDay = (day) => { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

/** A preset as the API's `since` (included) and `until` (excluded), in Paris days. */
export function presetRange(preset) {
  const today = parisDay();
  const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;      // Monday = 0
  switch (preset) {
    case 'today': return { since: today };
    case 'yesterday': return { since: parisDay(-1), until: today };
    case 'thisWeek': return { since: parisDay(-weekday) };
    case 'last7': return { since: parisDay(-6) };
    case 'last30': return { since: parisDay(-29) };
    case 'thisMonth': return { since: `${today.slice(0, 8)}01` };
    default: return {};
  }
}

/** Everything the list shows, for cleaned filters. Never throws: `failed` says Tower did not answer. */
export async function loadList(f) {
  const range = f.datePreset ? presetRange(f.datePreset) : { since: f.since, until: f.until ? nextDay(f.until) : '' };
  const filters = { q: f.q, veracity: f.veracity, claim_type: f.claimType, jurisdiction: f.juris, ...range };
  try {
    const [result, stats, statsAll] = await Promise.all([
      searchCases({ ...filters, sort: f.sort, page: f.page, per_page: PER_PAGE }),
      caseStats({ ...filters, veracity: [] }),                     // counts next to each verdict
      caseStats({ q: f.q }),                                        // the types and countries worth offering
    ]);
    const types = Object.keys(CLAIM_TYPES).filter((t) => statsAll?.by_claim_type?.[t] || t === f.claimType);
    const countries = [...new Set([...Object.keys(statsAll?.by_jurisdiction ?? {}), ...(f.juris ? [f.juris] : [])])]
      .sort((a, b) => jurisdiction(a).localeCompare(jurisdiction(b), 'fr'));
    return {
      failed: false,
      legacy: result.legacy ?? false,
      items: result.items ?? [],
      total: result.total ?? 0,
      page: f.page,
      pages: Math.min(result.pages ?? 0, MAX_PAGE),
      more: (result.pages ?? 0) > MAX_PAGE,
      counts: stats?.by_veracity ?? null,
      types,
      countries,
    };
  } catch (e) {
    console.error('Tower unavailable for the fact-check list', e instanceof ApiError ? `${e.status} ${e.code} ${e.requestId}` : e);
    return { failed: true, legacy: false, items: [], total: 0, page: f.page, pages: 0, more: false, counts: null, types: [], countries: [] };
  }
}
