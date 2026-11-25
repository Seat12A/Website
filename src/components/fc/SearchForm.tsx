/*
 * Search and filters of /fact-checks: a plain GET form (works without JavaScript), built from shadcn Input, Button and
 * NativeSelect. Verdict filters are checkboxes styled as toggles, each with its count. A small script in the page
 * submits the form when a filter changes (src/pages/fact-checks/index.astro).
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { CLAIM_TYPES, VERACITY, VERACITY_ORDER, jurisdiction } from '@/lib/labels.js';
import { PixelIcon } from './PixelIcon';

type Props = {
  q?: string;
  label?: string;
  filters?: {
    veracity: string[]; claimType: string; juris: string; sort: string;
    counts: Record<string, number> | null; types: string[]; countries: string[];
  } | null;
};

export function SearchForm({ q = '', label = 'Cherchez une affirmation, ou collez le lien d’un post X.', filters = null }: Props) {
  return (
    <form id="finder" method="get" action="/fact-checks" role="search" className="grid gap-4">
      <label htmlFor="q" className="text-sm text-muted-foreground">{label}</label>
      <div className="flex max-w-2xl gap-2 max-sm:flex-col">
        <div className="relative flex-1">
          <PixelIcon name="search" className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="q" name="q" type="search" defaultValue={q} maxLength={2000} autoComplete="off" spellCheck={false}
            placeholder="chômage, « phrase exacte », ou https://x.com/…/status/…" className="h-10 pl-9"
          />
        </div>
        <Button type="submit" className="h-10 px-5">Chercher</Button>
      </div>

      {filters && (
        <div className="filters flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <fieldset className="flex min-w-0 flex-wrap gap-2">
            <legend className="sr-only">Verdict</legend>
            {VERACITY_ORDER.map((v) => (
              <label
                key={v}
                data-veracity={v}
                className="relative inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-[13px] font-medium text-muted-foreground transition-colors select-none hover:bg-accent hover:text-foreground has-[:checked]:border-transparent has-[:checked]:bg-[color-mix(in_oklab,var(--v)_13%,transparent)] has-[:checked]:text-[var(--v)] has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
              >
                <input type="checkbox" name="veracity" value={v} defaultChecked={filters.veracity.includes(v)} className="peer sr-only" />
                <span className="dot size-2 text-[var(--v)]" aria-hidden="true" />
                {(VERACITY as Record<string, { label: string }>)[v].label}
                {filters.counts && <span className="font-mono text-xs tabular-nums opacity-70">{filters.counts[v] ?? 0}</span>}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-2 max-md:grid max-md:w-full max-md:grid-cols-2 max-md:[&_[data-slot=native-select-wrapper]]:w-full">
            <label>
              <span className="sr-only">Type d’affirmation</span>
              <NativeSelect name="claim_type" defaultValue={filters.claimType} size="sm" className="max-md:w-full">
                <NativeSelectOption value="">Tous les types</NativeSelectOption>
                {filters.types.map((t) => <NativeSelectOption key={t} value={t}>{(CLAIM_TYPES as Record<string, string>)[t]}</NativeSelectOption>)}
              </NativeSelect>
            </label>
            <label>
              <span className="sr-only">Pays concerné</span>
              <NativeSelect name="jurisdiction" defaultValue={filters.juris} size="sm" className="max-md:w-full">
                <NativeSelectOption value="">Tous les pays</NativeSelectOption>
                {filters.countries.map((c) => <NativeSelectOption key={c} value={c}>{jurisdiction(c)}</NativeSelectOption>)}
              </NativeSelect>
            </label>
            <label className="max-md:col-span-2">
              <span className="sr-only">Ordre</span>
              <NativeSelect name="sort" defaultValue={filters.sort} size="sm" className="max-md:w-full">
                {q && <NativeSelectOption value="relevance">Les plus pertinents</NativeSelectOption>}
                <NativeSelectOption value="newest">Les plus récents</NativeSelectOption>
                <NativeSelectOption value="oldest">Les plus anciens</NativeSelectOption>
              </NativeSelect>
            </label>
            <noscript><Button type="submit" variant="outline" size="sm">Filtrer</Button></noscript>
          </div>
        </div>
      )}
    </form>
  );
}
