/*
 * The fact-checks as rows (Linear-like list, Twitter-like hairlines): verdict, the claim (always between quotation
 * marks: it is what the post says, not what Seat 12A says) with its type and countries, the date. The whole row opens
 * the fact-check. Sorted by date, rows are grouped by month, each group with its count on this page.
 */
import { ChevronRightIcon } from '@/components/icons';
import { CLAIM_TYPES, CONTEXT_NEED, jurisdiction, quote, title as claimTitle } from '@/lib/labels.js';
import { VerdictBadge } from './VerdictBadge';

export type ListItem = {
  public_id: string; kind: string; title: string | null; claim_type: string | null; jurisdictions?: string[];
  context_need?: string | null; veracity: string | null; verdict_state: string | null; published_at: string | null; updated_at: string;
};

const STATE: Record<string, string> = { expired: 'Peut être dépassé', superseded: 'Mis à jour depuis' };
const TZ = 'Europe/Paris';
const monthFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, month: 'long', year: 'numeric' });
const dayFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, day: 'numeric', month: 'short' });
const monthOf = (iso: string) => { const m = monthFmt.format(new Date(iso)); return m.charAt(0).toUpperCase() + m.slice(1); };

export function FactCheckList({ items, grouped }: { items: ListItem[]; grouped: boolean }) {
  const groups: { label: string | null; items: ListItem[] }[] = [];
  for (const c of items) {
    const label = grouped ? monthOf(c.published_at ?? c.updated_at) : null;
    if (!groups.length || groups.at(-1)!.label !== label) groups.push({ label, items: [] });
    groups.at(-1)!.items.push(c);
  }
  return (
    <div className="flex flex-col">
      {groups.map((g, gi) => (
        <section key={`${g.label}-${gi}`} aria-label={g.label ?? undefined}>
          {g.label && (
            <h2 className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2 text-[13px] font-medium md:px-6">
              {g.label}
              <span className="text-muted-foreground tabular-nums">{g.items.length}</span>
            </h2>
          )}
          <ul>
            {g.items.map((c) => <Row key={c.public_id} c={c} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Row({ c }: { c: ListItem }) {
  const date = c.published_at ?? c.updated_at;
  const meta = [
    c.claim_type && (CLAIM_TYPES as Record<string, string>)[c.claim_type],
    ...(c.jurisdictions ?? []).map(jurisdiction),
    c.context_need && (CONTEXT_NEED as Record<string, string | null>)[c.context_need],
    c.verdict_state && STATE[c.verdict_state],
  ].filter(Boolean);
  const title = c.title ? quote(claimTitle(c.title)) : c.kind === 'moderation' ? 'Modération' : 'Vérification sans titre';
  return (
    <li className="border-b">
      <a
        href={`/fact-checks/${c.public_id}`}
        className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3.5 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/70 md:grid-cols-[7.5rem_minmax(0,1fr)_auto_1rem] md:px-6"
      >
        <span className="max-md:col-start-1 max-md:row-start-1">
          {c.veracity ? <VerdictBadge veracity={c.veracity} /> : <span className="text-xs text-muted-foreground">{c.kind === 'moderation' ? 'Modération' : ''}</span>}
        </span>
        <span className="min-w-0 max-md:col-span-2 max-md:row-start-2">
          <span className="line-clamp-2 text-[15px] leading-snug font-medium">{title}</span>
          {meta.length > 0 && <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{meta.join(' · ')}</span>}
        </span>
        <time dateTime={date} className="text-[13px] text-muted-foreground tabular-nums max-md:col-start-2 max-md:row-start-1 max-md:justify-self-end">{dayFmt.format(new Date(date))}</time>
        <ChevronRightIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 max-md:hidden" />
      </a>
    </li>
  );
}
