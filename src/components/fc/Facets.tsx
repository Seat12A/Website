/*
 * The right column of /fact-checks: what the list contains, by verdict, type and country, with the counts from Tower's
 * stats. Each row filters (and adds its chip); clicked again, it un-filters. Counts of a facet ignore that facet's own
 * filter (src/lib/factchecks.js), so the other values stay countable.
 */
import { cn } from '@/lib/utils';
import { CLAIM_TYPES, VERACITY, VERACITY_ORDER, jurisdiction } from '@/lib/labels.js';
import { VERDICT_ICONS } from './VerdictBadge';

type Row = { value: string; label: string; count: number; selected: boolean; veracity?: string };

export function Facets({
  counts, typeCounts, countryCounts, veracity, type, country, onVeracity, onType, onCountry,
}: {
  counts: Record<string, number> | null; typeCounts: Record<string, number>; countryCounts: Record<string, number>;
  veracity: string[]; type?: string; country?: string;
  onVeracity: (v: string) => void; onType: (t: string) => void; onCountry: (c: string) => void;
}) {
  const verdicts: Row[] = VERACITY_ORDER.map((v) => ({
    value: v, label: (VERACITY as Record<string, { label: string }>)[v].label, count: counts?.[v] ?? 0, selected: veracity.includes(v), veracity: v,
  }));
  const types: Row[] = Object.entries(typeCounts).filter(([t]) => t in CLAIM_TYPES).slice(0, 8)
    .map(([t, n]) => ({ value: t, label: (CLAIM_TYPES as Record<string, string>)[t], count: n, selected: t === type }));
  const countries: Row[] = Object.entries(countryCounts).slice(0, 8)
    .map(([c, n]) => ({ value: c, label: jurisdiction(c), count: n, selected: c === country }));
  return (
    <div className="flex flex-col gap-8">
      {counts && <Facet title="Verdicts" rows={verdicts} onPick={onVeracity} />}
      {types.length > 0 && <Facet title="Types d’affirmation" rows={types} onPick={onType} />}
      {countries.length > 0 && <Facet title="Pays concernés" rows={countries} onPick={onCountry} />}
    </div>
  );
}

function Facet({ title, rows, onPick }: { title: string; rows: Row[]; onPick: (v: string) => void }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="px-2 pb-1 text-[13px] font-medium text-muted-foreground">{title}</h2>
      <ul className="flex flex-col">
        {rows.map((r) => {
          const Icon = r.veracity ? VERDICT_ICONS[r.veracity] : null;
          return (
            <li key={r.value}>
              <button
                type="button"
                aria-pressed={r.selected}
                onClick={() => onPick(r.value)}
                data-veracity={r.veracity}
                className={cn(
                  'flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2 py-1.5 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  r.selected ? 'bg-filter text-filter-foreground' : 'hover:bg-muted',
                )}
              >
                {Icon && <Icon className="size-4 text-(--v)" />}
                <span className="min-w-0 flex-1 truncate">{r.label}</span>
                <span className="text-[13px] text-muted-foreground tabular-nums">{r.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
