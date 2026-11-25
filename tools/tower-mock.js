/*
 * A small stand-in for the public API of Tower, for checking the fact-check pages locally (tools/pages.js). It answers
 * the routes the site uses with the shapes of docs/api-tower.md.
 *
 * TEST DATA ONLY: these fact-checks are made up to fill the layout (taken from the examples of the API documentation).
 * They are never served to visitors: the site reads the real Tower unless TOWER_API_URL points here.
 */
import http from 'node:http';

const day = (d, h = 10) => `2026-11-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00Z`;
const route = (d) => [
  { status: 'received', at: day(d, 8) }, { status: 'in_review', at: day(d, 9) },
  { status: 'validated', at: day(d, 11) }, { status: 'published', at: day(d, 12) },
].map((t) => ({ ...t, from_status: null, actor: null, reason: null }));

const RAW = [
  ['Le chômage a doublé en un an', 'false', 'statistic', ['FR'], 'necessary', ['missing_baseline', 'cherry_picking'], 24, 'current'],
  ['Le président a déclaré la guerre au café', 'misleading', 'quote', ['US'], 'necessary', ['quote_integrity'], 23, 'current'],
  ['Cette photo de manifestation a été prise hier à Paris', 'false', 'historical_fact', ['FR'], 'necessary', ['recycled_media'], 22, 'current'],
  ['Les prix de l’électricité ont augmenté de 10 % au 1er août', 'mostly_true', 'statistic', ['FR'], 'useful', ['scope'], 21, 'current'],
  ['La loi interdit désormais de filmer la police', 'misleading', 'legal_text', ['FR'], 'necessary', ['misrepresented_source', 'definition'], 20, 'current'],
  ['Le Parlement européen a voté la fin des voitures thermiques en 2035', 'true', 'legal_text', ['EU'], 'useful', ['procedure'], 19, 'current'],
  ['Ce médicament guérit la maladie en trois jours', 'unverifiable', 'causal', ['INT'], 'necessary', ['scientific_uncertainty'], 18, 'expired'],
  ['La ville a fermé toutes ses piscines cet été', 'false', 'record', ['BE'], 'necessary', ['outdated'], 17, 'superseded'],
];
const CASES = RAW.map(([title, veracity, claim_type, jurisdictions, context_need, context_types, d, state], i) => {
  const post = String(1850000000000000042n + BigInt(i));
  return {
    public_id: `8629aa57-5f7e-466b-a483-ae5350be5b${String(80 + i).padStart(2, '0')}`,
    kind: 'fact_check', title, platform: 'x', x_post_id: post, external_id: post,
    url: `https://x.com/i/status/${post}`, published_url: `https://x.com/seat12a/status/${1850000000000000901n + BigInt(i)}`,
    published_at: day(d, 12), created_at: day(d, 8), updated_at: day(d, 12), claim_type, claim_lang: i === 1 ? 'en' : 'fr',
    jurisdictions, veracity, context_need, verdict_state: state, status: null, priority: null, assigned_to: null,
    _context_types: context_types, _day: d,
  };
});
const publicFields = ({ _context_types, _day, ...c }) => c;

function details(c) {
  return {
    ...publicFields(c),
    content: { platform: 'x', external_id: c.external_id, url: c.url, lang: c.claim_lang },
    claim: { text: c.title, lang: 'fr', text_fr: c.title, claim_type: c.claim_type, subject: c.claim_type === 'quote' ? 'Président des États-Unis' : null, place: null, period_start: c.claim_type === 'statistic' ? '2025-10-01' : null, period_end: c.claim_type === 'statistic' ? '2026-09-30' : null, jurisdictions: c.jurisdictions },
    verdict: { id: '208f911a-fc06-4172-8ce5-62acaae46b75', veracity: c.veracity, context_need: c.context_need, context_types: c._context_types, validated_at: day(c._day, 11), expires_at: null, state: c.verdict_state },
    note: {
      lang: 'fr',
      text: 'Le taux de chômage est stable depuis 2023, autour de 7,4 %. Le chiffre qui circule compare deux indicateurs différents : les inscrits à France Travail d’une catégorie, et le taux mesuré par l’Insee.',
      fact_sheet: 'Données de test pour la mise en page.\n\nUn deuxième paragraphe, plus long, pour voir comment la fiche détaillée se lit quand elle fait plusieurs lignes et qu’elle explique la méthode du calcul, les sources consultées et les limites de la vérification.',
      machine_translated: c.claim_lang === 'en',
      links: ['https://www.insee.fr/fr/statistiques/serie/001688526', 'https://dares.travail-emploi.gouv.fr/donnees/demandeurs-demploi-inscrits-a-france-travail', 'https://example.org/'],
    },
    posts_count: 3,
    timeline: route(c._day),
    internal: null,
  };
}

function search(qs) {
  const q = (qs.get('q') ?? '').toLowerCase(), ver = qs.getAll('veracity'), type = qs.get('claim_type'), juris = qs.get('jurisdiction');
  let items = CASES.filter((c) => (!q || c.title.toLowerCase().includes(q)) && (!ver.length || ver.includes(c.veracity))
    && (!type || c.claim_type === type) && (!juris || c.jurisdictions.includes(juris.toUpperCase()))
    && (!qs.get('since') || c.published_at >= qs.get('since')) && (!qs.get('until') || c.published_at < qs.get('until')));
  if (qs.get('sort') === 'oldest') items = [...items].reverse();
  return items;
}
function count(items, key) {
  const out = {};
  for (const c of items) for (const v of [].concat(c[key] ?? [])) out[v] = (out[v] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1]));
}

export function startTowerMock(port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://mock');
    const send = (status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
    const error = (status, code) => send(status, { error: { code, message: code, details: {}, request_id: 'mock' } });
    const p = url.pathname;
    if (p === '/v1/cases/search') {
      const all = search(url.searchParams), per = Number(url.searchParams.get('per_page') ?? 20), page = Number(url.searchParams.get('page') ?? 1);
      return send(200, { items: all.slice((page - 1) * per, page * per).map(publicFields), page, per_page: per, total: all.length, pages: Math.ceil(all.length / per) });
    }
    if (p === '/v1/cases/stats') {
      const all = search(url.searchParams);
      return send(200, { total: all.length, by_kind: count(all, 'kind'), by_veracity: count(all, 'veracity'), by_claim_type: count(all, 'claim_type'), by_lang: count(all, 'claim_lang'), by_jurisdiction: count(all, 'jurisdictions'), by_status: null, interval: 'month', timeline: [{ period: '2026-11-01', count: all.length }], generated_at: new Date().toISOString() });
    }
    let m = p.match(/^\/v1\/cases\/([^/]+)\/details$/);
    if (m) { const c = CASES.find((x) => x.public_id === m[1]); return c ? send(200, details(c)) : error(404, 'TWR-DOS-001'); }
    m = p.match(/^\/v1\/content\/x\/(\d+)\/verdict$/);
    if (m) {
      const c = CASES.find((x) => x.external_id === m[1] && x.verdict_state === 'current');
      if (!c) return error(404, 'TWR-FCK-013');
      const d = details(c);
      return send(200, { platform: 'x', external_id: c.external_id, url: c.url, lang: 'fr', claims: [{ text: c.title, lang: 'fr', veracity: c.veracity, context_need: c.context_need, context_types: c._context_types, validated_at: d.verdict.validated_at, note: d.note, inherited: m[1].endsWith('3') ? { rule: 'identical_signature', origin_verdict_id: 'x', origin_url: 'https://x.com/i/status/1850000000000000001' } : null }] });
    }
    return error(404, 'TWR-GEN-002');
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

export const MOCK_CASES = CASES.map((c) => ({ id: c.public_id, post: c.external_id }));
