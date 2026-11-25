/*
 * French labels for the values of the Tower API (docs/api-tower.md §2), and small formatting helpers.
 * Visitors never see the word "case": it is a "fact-check" or a "vérification" (docs/decisions.md).
 */

/* Verdicts. Each one is shown with a colour, an icon and its label, never the colour alone (VerdictBadge.tsx). The
   colours (global.css, --v-*) avoid the political red/blue pair: teal, sage, amber, coral, grey. */
export const VERACITY = {
  true: { label: 'Vrai' },
  mostly_true: { label: 'Plutôt vrai' },
  misleading: { label: 'Trompeur' },
  false: { label: 'Faux' },
  unverifiable: { label: 'Non vérifiable' },
};
export const VERACITY_ORDER = ['false', 'misleading', 'mostly_true', 'true', 'unverifiable'];

export const CONTEXT_NEED = {
  none: null,
  useful: 'Contexte utile',
  necessary: 'Contexte nécessaire',
};

export const CONTEXT_TYPES = {
  outdated: 'Information dépassée',
  recycled_media: 'Image ou vidéo ancienne réutilisée',
  manipulated_media: 'Média manipulé',
  cherry_picking: 'Sélection partielle des faits',
  missing_baseline: 'Point de comparaison manquant',
  quote_integrity: 'Citation tronquée ou déformée',
  misrepresented_source: 'Source mal représentée',
  causation: 'Corrélation présentée comme une cause',
  definition: 'Problème de définition',
  scope: 'Portée exagérée',
  procedure: 'Procédure mal décrite',
  scientific_uncertainty: 'Incertitude scientifique',
  satire: 'Satire',
  missing_event_context: "Contexte de l'événement manquant",
  developing: "Situation en cours d'évolution",
};

export const CLAIM_TYPES = {
  statistic: 'Statistique',
  historical_fact: 'Fait',
  quote: 'Citation ou déclaration attribuée',
  legal_text: 'Texte de loi',
  ongoing_situation: 'Situation en cours',
  procedure: 'Procédure',
  record: 'Bilan',
  conduct: "Conduite d'une personne ou d'une organisation",
  accusation: 'Accusation',
  prediction: 'Prédiction',
  opinion: 'Opinion',
  causal: 'Lien de cause à effet',
  other: 'Autre',
};

export const PLATFORMS = {
  x: 'X', bluesky: 'Bluesky', threads: 'Threads', mastodon: 'Mastodon', youtube: 'YouTube', tiktok: 'TikTok',
  telegram: 'Telegram', web: 'Web',
};

/* Timeline of a case, as a flight: received, under review, validated, published. */
export const STATUSES = {
  received: 'Reçu',
  in_review: 'En examen',
  validated: 'Validé',
  published: 'Publié',
};

/* Jurisdictions: ISO 3166 codes, plus EU and INT. Intl gives the French name of any country code. */
const regionNames = new Intl.DisplayNames(['fr'], { type: 'region' });
export function jurisdiction(code) {
  if (!code) return '';
  const c = code.toUpperCase();
  if (c === 'EU') return 'Union européenne';
  if (c === 'INT') return 'International';
  try { return regionNames.of(c) ?? c; } catch { return c; }
}

const languageNames = new Intl.DisplayNames(['fr'], { type: 'language' });
export function language(code) {
  if (!code) return '';
  try { return languageNames.of(code) ?? code; } catch { return code; }
}

/* Dates are shown in Paris time, in French. */
const TZ = 'Europe/Paris';
const dayFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
const boardFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, day: '2-digit', month: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const parse = (iso) => (iso ? new Date(iso) : null);
const valid = (d) => d && !Number.isNaN(d.getTime());

/* French writes the first day of a month "1er" */
const first = (s) => s.replace(/^1 /, '1er ');
export const longDate = (iso) => { const d = parse(iso); return valid(d) ? first(dayFmt.format(d)) : ''; };
export const shortDate = (iso) => { const d = parse(iso); return valid(d) ? shortFmt.format(d) : ''; };
export const boardDate = (iso) => { const d = parse(iso); return valid(d) ? boardFmt.format(d) : ''; };
export const clock = (iso) => { const d = parse(iso); return valid(d) ? timeFmt.format(d) : ''; };

/* A period of a claim (dates only, "AAAA-MM-JJ"). */
export function period(start, end) {
  const f = (s) => (s ? first(dayFmt.format(new Date(`${s}T12:00:00Z`))) : '');
  if (start && end && start !== end) return `du ${f(start)} au ${f(end)}`;
  return f(start || end);
}

/* "3 vérifications", "1 vérification", "aucune vérification". */
export function plural(n, one, many, none) {
  if (!n) return none ?? `0 ${many}`;
  return `${n.toLocaleString('fr-FR')} ${n === 1 ? one : many}`;
}

/* The id of a post in an X link (x.com or twitter.com, with or without www. or mobile.). Always a string: post ids do
   not fit in a JavaScript number. */
export function xPostId(link) {
  const m = String(link ?? '').trim().match(
    /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com\/(?:[A-Za-z0-9_]{1,15}|i(?:\/web)?)\/status\/(\d{1,20})/,
  );
  return m ? m[1] : null;
}

/* A source link shown as its site and a short path: "insee.fr/fr/statistiques/…". */
export function sourceLabel(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = decodeURIComponent(u.pathname).replace(/\/$/, '');
    return { host, path: path.length > 42 ? `${path.slice(0, 40)}…` : path };
  } catch {
    return { host: url, path: '' };
  }
}

/* A claim between French quotation marks, with non-breaking spaces so that a mark never ends up alone on a line. */
export const quote = (text) => `«\u00A0${String(text).trim()}\u00A0»`;

/* Tower cuts `title` at 200 characters (the full claim is in the details): mark the cut with an ellipsis. */
export const title = (text) => { const t = String(text ?? '').trim(); return [...t].length >= 200 ? `${t.replace(/[\s,;:.]*$/, '')}…` : t; };

/* Only http(s) links are rendered as links. */
export const safeUrl = (url) => (/^https?:\/\//i.test(String(url ?? '')) ? url : null);
