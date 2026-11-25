/*
 * Model of the filter chips of /fact-checks (no JSX): the filters, their metadata, the values, and the address they
 * make. Two pieces of state: `activeKeys` (the chips shown, in the order they were added) and `values` (what is
 * actually filtered). A chip can exist without a value while it is being set; only values reach the address and Tower.
 */
import type { LucideIcon } from 'lucide-react';
import { CalendarIcon, CircleCheckIcon, GlobeIcon, TagIcon } from 'lucide-react';

export type FilterKey = 'veracity' | 'type' | 'country' | 'date';
export type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'last7' | 'last30' | 'thisMonth';
export type Sort = 'newest' | 'oldest' | 'relevance';

export interface FilterValues {
  veracity?: string[];          // several verdicts: OR
  type?: string;
  country?: string;
  datePreset?: DatePreset;      // a preset, or…
  since?: string;               // …a custom range, AAAA-MM-JJ, both days included
  until?: string;
}

export const FILTER_KEYS: FilterKey[] = ['veracity', 'type', 'country', 'date'];

export const FILTER_META: Record<FilterKey, { icon: LucideIcon; label: string; wide?: boolean }> = {
  veracity: { icon: CircleCheckIcon, label: 'Verdict' },
  type: { icon: TagIcon, label: 'Type', wide: true },
  country: { icon: GlobeIcon, label: 'Pays', wide: true },
  date: { icon: CalendarIcon, label: 'Date', wide: true },
};

export const DATE_PRESETS: Record<DatePreset, string> = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  thisWeek: 'Cette semaine',
  last7: '7 derniers jours',
  last30: '30 derniers jours',
  thisMonth: 'Ce mois-ci',
};

export const SORTS: Record<Sort, string> = {
  newest: 'Les plus récents',
  oldest: 'Les plus anciens',
  relevance: 'Les plus pertinents',
};

export function hasValue(key: FilterKey, v: FilterValues): boolean {
  switch (key) {
    case 'veracity': return (v.veracity?.length ?? 0) > 0;
    case 'type': return !!v.type;
    case 'country': return !!v.country;
    case 'date': return !!(v.datePreset || v.since || v.until);
  }
}

export const countFilters = (v: FilterValues, keys: FilterKey[]) => keys.filter((k) => hasValue(k, v)).length;

/** The values a filter owns, removed (when its chip goes). */
export function clearFilter(key: FilterKey, v: FilterValues): FilterValues {
  const next = { ...v };
  if (key === 'date') { delete next.datePreset; delete next.since; delete next.until; }
  else delete next[key];
  return next;
}

/** The address of a state: filters in chip order, empty ones left out, the default order and page 1 omitted. */
export function toSearch(q: string, values: FilterValues, keys: FilterKey[], sort: Sort, page: number): string {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  for (const k of keys) {
    if (k === 'veracity') values.veracity?.forEach((x) => p.append('veracity', x));
    if (k === 'type' && values.type) p.set('claim_type', values.type);
    if (k === 'country' && values.country) p.set('jurisdiction', values.country);
    if (k === 'date') {
      if (values.datePreset) p.set('date', values.datePreset);
      else { if (values.since) p.set('since', values.since); if (values.until) p.set('until', values.until); }
    }
  }
  if (sort !== (q ? 'relevance' : 'newest')) p.set('sort', sort);
  if (page > 1) p.set('page', String(page));
  const s = p.toString();
  return s ? `?${s}` : '';
}

/* "12 nov." for a chip */
const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const chipDay = (day?: string) => (day ? dayFmt.format(new Date(`${day}T12:00:00Z`)) : '…');
