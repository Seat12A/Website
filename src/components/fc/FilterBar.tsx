/*
 * The filter chips of /fact-checks (model: filters.ts). One chip per filter added, in the order added; a click opens
 * its editor in a Popover, with "Retirer le filtre" at the bottom. Behaviour:
 *   1. Adding a filter opens its editor right away (delayed, see below).
 *   2. An editor closed without a value removes its chip: no empty chip stays behind.
 *   3. A single choice (type, country, a date preset) closes the editor; verdicts (several) and a custom range don't.
 *   4. Each filter appears once; the menu offers only the unused ones.
 * Trap: the click that picks a filter in the DropdownMenu (and the focus coming back while the menu closes) reaches the
 * new Popover as a click outside, which would close it, and rule 2 would remove the chip at once. So the editor opens
 * 160 ms after being added, closings are ignored for 250 ms after an opening, and the menu is not modal.
 */
import * as React from 'react';
import { AddIcon, CheckIcon, ChevronDownIcon, DeleteIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CLAIM_TYPES, VERACITY, VERACITY_ORDER, jurisdiction } from '@/lib/labels.js';
import {
  DATE_PRESETS, FILTER_META, chipDay, hasValue, type DatePreset, type FilterKey, type FilterValues,
} from './filters';

export type FilterOptions = { counts: Record<string, number> | null; types: string[]; countries: string[] };

/* ---------- The bar ---------- */

export function FilterChips({
  activeKeys, values, pendingKey, options, available, onAdd, onRemove, onPatch,
}: {
  activeKeys: FilterKey[]; values: FilterValues; pendingKey: FilterKey | null; options: FilterOptions;
  available: FilterKey[]; onAdd: (k: FilterKey) => void; onRemove: (k: FilterKey) => void; onPatch: (p: Partial<FilterValues>) => void;
}) {
  if (activeKeys.length === 0) return null;
  const unused = available.filter((k) => !activeKeys.includes(k));
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtres actifs" role="group">
      {activeKeys.map((k) => (
        <FilterChip key={k} filterKey={k} values={values} options={options} autoOpen={pendingKey === k} onRemove={() => onRemove(k)} onPatch={onPatch} />
      ))}
      {unused.length > 0 && (
        <AddFilterMenu keys={unused} onAdd={onAdd}>
          <Button variant="ghost" size="xs" className="text-muted-foreground">
            <AddIcon data-icon="inline-start" />
            Filtrer
          </Button>
        </AddFilterMenu>
      )}
    </div>
  );
}

/** The menu that adds a filter; its trigger is the child (the toolbar's icon button, or "+ Filtrer"). */
export function AddFilterMenu({ keys, onAdd, children }: { keys: FilterKey[]; onAdd: (k: FilterKey) => void; children: React.ReactNode }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Ajouter un filtre</DropdownMenuLabel>
          {keys.length === 0 && <DropdownMenuItem disabled>Tous les filtres sont utilisés</DropdownMenuItem>}
          {keys.map((k) => {
            const { icon: Icon, label } = FILTER_META[k];
            return <DropdownMenuItem key={k} onSelect={() => onAdd(k)}><Icon />{label}</DropdownMenuItem>;
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- One chip ---------- */

function FilterChip({
  filterKey, values, options, autoOpen, onRemove, onPatch,
}: {
  filterKey: FilterKey; values: FilterValues; options: FilterOptions; autoOpen: boolean;
  onRemove: () => void; onPatch: (p: Partial<FilterValues>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const openedAt = React.useRef(0);
  const valuesRef = React.useRef(values);
  valuesRef.current = values;

  React.useEffect(() => {
    if (!autoOpen) return;
    const id = setTimeout(() => { openedAt.current = Date.now(); setOpen(true); }, 160);
    return () => clearTimeout(id);
  }, [autoOpen]);

  const close = React.useCallback(() => {
    setOpen(false);
    if (!hasValue(filterKey, valuesRef.current)) onRemove();
  }, [filterKey, onRemove]);

  const onOpenChange = (o: boolean) => {
    if (o) { openedAt.current = Date.now(); setOpen(true); return; }
    if (Date.now() - openedAt.current < 250) return;
    close();
  };
  /* after a single choice: the new value is in the next render, so close without the empty check */
  const choose = (patch: Partial<FilterValues>) => { onPatch(patch); setOpen(false); };

  const { icon: Icon, label, wide } = FILTER_META[filterKey];
  const filled = hasValue(filterKey, values);
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className="border-filter-border bg-filter text-filter-foreground hover:bg-filter-hover hover:text-filter-foreground aria-expanded:bg-filter-hover aria-expanded:text-filter-foreground"
        >
          <Icon data-icon="inline-start" />
          {filled ? <><span className="font-semibold">{label} :</span><span className="max-w-40 truncate font-normal">{chipValue(filterKey, values)}</span></> : label}
          <ChevronDownIcon data-icon="inline-end" className="opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn('gap-1 p-2', filterKey === 'date' ? 'w-80' : wide ? 'w-72' : 'w-60')}>
        <p className="flex items-center gap-1.5 px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground"><Icon className="size-3.5" />{label}</p>
        {filterKey === 'veracity' && <VerdictEditor value={values.veracity ?? []} counts={options.counts} onChange={(veracity) => onPatch({ veracity })} />}
        {filterKey === 'type' && (
          <ChoiceList
            options={options.types.map((t) => ({ value: t, label: (CLAIM_TYPES as Record<string, string>)[t] }))}
            value={values.type} empty="Aucun type pour l’instant." onChange={(type) => choose({ type })}
          />
        )}
        {filterKey === 'country' && (
          <ChoiceList
            options={options.countries.map((c) => ({ value: c, label: jurisdiction(c) }))}
            value={values.country} empty="Aucun pays pour l’instant." onChange={(country) => choose({ country })}
          />
        )}
        {filterKey === 'date' && <DateEditor values={values} onPreset={(datePreset) => choose({ datePreset, since: undefined, until: undefined })} onRange={(r) => onPatch({ ...r, datePreset: undefined })} />}
        <Separator className="my-1" />
        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { setOpen(false); onRemove(); }}>
          <DeleteIcon data-icon="inline-start" />
          Retirer le filtre
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function chipValue(key: FilterKey, v: FilterValues): string {
  switch (key) {
    case 'veracity': return (v.veracity ?? []).map((x) => (VERACITY as Record<string, { label: string }>)[x]?.label ?? x).join(', ');
    case 'type': return (CLAIM_TYPES as Record<string, string>)[v.type ?? ''] ?? v.type ?? '';
    case 'country': return jurisdiction(v.country);
    case 'date': return v.datePreset ? DATE_PRESETS[v.datePreset] : `${chipDay(v.since)} – ${chipDay(v.until)}`;
  }
}

/* ---------- Editors ---------- */

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
        selected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {selected && <CheckIcon className="size-4 text-primary" />}
    </button>
  );
}

function ChoiceList({ options, value, empty, onChange }: {
  options: { value: string; label: string }[]; value?: string; empty: string; onChange: (v: string) => void;
}) {
  if (!options.length) return <p className="px-2.5 py-1.5 text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
      {options.map((o) => <Option key={o.value} selected={o.value === value} onClick={() => onChange(o.value)}>{o.label}</Option>)}
    </div>
  );
}

function VerdictEditor({ value, counts, onChange }: { value: string[]; counts: Record<string, number> | null; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      {VERACITY_ORDER.map((v) => {
        const id = `verdict-${v}`;
        const checked = value.includes(v);
        return (
          <label key={v} htmlFor={id} data-veracity={v} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm transition-colors hover:bg-muted">
            <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(c ? [...value, v] : value.filter((x) => x !== v))} />
            <span className="size-2 rounded-full bg-(--v)" aria-hidden="true" />
            <span className="flex-1">{(VERACITY as Record<string, { label: string }>)[v].label}</span>
            {counts && <span className="font-mono text-xs text-muted-foreground tabular-nums">{counts[v] ?? 0}</span>}
          </label>
        );
      })}
    </div>
  );
}

function DateEditor({ values, onPreset, onRange }: {
  values: FilterValues; onPreset: (p: DatePreset) => void; onRange: (r: { since?: string; until?: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {(Object.keys(DATE_PRESETS) as DatePreset[]).map((p) => (
        <Option key={p} selected={values.datePreset === p} onClick={() => onPreset(p)}>{DATE_PRESETS[p]}</Option>
      ))}
      <Separator className="my-1" />
      <p className="px-2.5 pt-1 text-xs font-medium text-muted-foreground">Plage personnalisée</p>
      <FieldGroup className="grid grid-cols-2 gap-2 px-1 py-1.5">
        <Field className="min-w-0 gap-1.5">
          <FieldLabel htmlFor="date-since" className="text-xs font-normal text-muted-foreground">Du</FieldLabel>
          <Input id="date-since" type="date" value={values.since ?? ''} max={values.until || undefined} onChange={(e) => onRange({ since: e.target.value || undefined, until: values.until })} />
        </Field>
        <Field className="min-w-0 gap-1.5">
          <FieldLabel htmlFor="date-until" className="text-xs font-normal text-muted-foreground">Au</FieldLabel>
          <Input id="date-until" type="date" value={values.until ?? ''} min={values.since || undefined} onChange={(e) => onRange({ since: values.since, until: e.target.value || undefined })} />
        </Field>
      </FieldGroup>
    </div>
  );
}
