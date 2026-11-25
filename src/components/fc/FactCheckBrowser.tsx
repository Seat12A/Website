/*
 * The list of /fact-checks, full width (a React island, client:load). First render on the server with the data of the
 * address; after that, each change asks /api/fact-checks (which asks Tower) and updates the address (replaceState), so
 * a filtered list can be shared and survives a reload.
 *
 * Layout: the list on the left (title and count, a sticky toolbar, rows), the facets on the right (by verdict, type,
 * country; each row filters). Toolbar: the search (debounced 350 ms, "/" focuses it), order, add a filter (blue as
 * soon as a filter has a value), refresh; under it the chips (FilterBar.tsx). While a page loads, the current list
 * stays and the refresh icon spins. A pasted X link is not a search: Enter opens /post/x/{id}. Without JavaScript the
 * search still works (a plain GET form) and the address's filters still apply.
 */
import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CloseIcon, CloudOffIcon, FilterIcon, RefreshIcon, SearchIcon, SortIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { plural, quote, xPostId } from '@/lib/labels.js';
import { AddFilterMenu, FilterChips } from './FilterBar';
import { Facets } from './Facets';
import { FactCheckList, type ListItem } from './FactCheckList';
import { FILTER_KEYS, SORTS, clearFilter, countFilters, toSearch, type FilterKey, type FilterValues, type Sort } from './filters';

export type ListData = {
  failed: boolean; legacy: boolean; items: ListItem[]; total: number; page: number; pages: number; more: boolean;
  counts: Record<string, number> | null; typeCounts: Record<string, number>; countryCounts: Record<string, number>;
  types: string[]; countries: string[];
};
export type InitialState = { q: string; values: FilterValues; activeKeys: FilterKey[]; sort: Sort; page: number };

const clean = (s: string) => s.trim().replace(/\s+/g, ' ');
const NB = ' ';

export function FactCheckBrowser({ initial, data: initialData }: { initial: InitialState; data: ListData }) {
  const [q, setQ] = React.useState(initial.q);
  const [debouncedQ, setDebouncedQ] = React.useState(initial.q);
  const [activeKeys, setActiveKeys] = React.useState<FilterKey[]>(initial.activeKeys);
  const [values, setValues] = React.useState<FilterValues>(initial.values);
  const [pendingKey, setPendingKey] = React.useState<FilterKey | null>(null);
  const [sort, setSort] = React.useState<Sort>(initial.sort);
  const [page, setPage] = React.useState(initial.page);
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(false);
  const [nonce, setNonce] = React.useState(0);
  const top = React.useRef<HTMLDivElement>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const first = React.useRef(true);
  /* the full placeholder does not fit a phone's search field */
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => { setNarrow(!matchMedia('(min-width: 640px)').matches); }, []);

  const runSearch = (next: string) => { setDebouncedQ(next); setPage(1); setSort(next ? 'relevance' : 'newest'); };

  /* search debounced at 350 ms; a new search starts at page 1 with the default order */
  React.useEffect(() => {
    const id = setTimeout(() => { const next = clean(q); if (next !== debouncedQ && !xPostId(next)) runSearch(next); }, 350);
    return () => clearTimeout(id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  /* "/" focuses the search, unless one is typing somewhere */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault(); input.current?.focus();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  /* fetch whenever what is filtered changes (empty chips change nothing) */
  const search = toSearch(debouncedQ, values, activeKeys, sort, page);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    history.replaceState(null, '', `/fact-checks${search}`);
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/fact-checks${search}`, { signal: ctrl.signal, headers: { accept: 'application/json' } })
      .then((r) => r.json())
      .then((d: ListData) => setData(d))
      .catch((e) => { if (e.name !== 'AbortError') setData((d) => ({ ...d, failed: true })); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [search, nonce]);

  const ensureKey = (k: FilterKey) => setActiveKeys((prev) => (prev.includes(k) ? prev : [...prev, k]));
  const addFilter = (k: FilterKey) => { ensureKey(k); setPendingKey(k); };
  const removeFilter = React.useCallback((k: FilterKey) => {
    setActiveKeys((prev) => prev.filter((x) => x !== k));
    setValues((prev) => clearFilter(k, prev));
    setPendingKey((p) => (p === k ? null : p));
    setPage(1);
  }, []);
  const patchFilter = (patch: Partial<FilterValues>) => { setValues((prev) => ({ ...prev, ...patch })); setPage(1); };
  const clearAll = () => { setActiveKeys([]); setValues({}); setQ(''); runSearch(''); };

  /* the facets on the right: a click filters, a second click un-filters */
  const toggleVerdict = (v: string) => {
    const cur = values.veracity ?? [];
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    if (!next.length) { removeFilter('veracity'); return; }
    ensureKey('veracity'); patchFilter({ veracity: next });
  };
  const toggleOne = (k: 'type' | 'country') => (value: string) => {
    if (values[k] === value) { removeFilter(k); return; }
    ensureKey(k); patchFilter({ [k]: value });
  };

  const goTo = (n: number) => (e: React.MouseEvent) => {
    e.preventDefault(); setPage(n);
    top.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = xPostId(q);
    if (id) { location.assign(`/post/x/${id}`); return; }
    if (clean(q) !== debouncedQ) runSearch(clean(q));
  };

  const filtersOn = !data.legacy && !data.failed;
  const available = filtersOn ? FILTER_KEYS : [];
  const unused = available.filter((k) => !activeKeys.includes(k));
  const nFilters = countFilters(values, activeKeys);
  const searched = !!debouncedQ || nFilters > 0;
  const pastedLink = !!xPostId(q);
  const options = { counts: data.counts, types: data.types, countries: data.countries };
  const countLine = data.failed ? '' : searched && !data.legacy
    ? plural(data.total, 'résultat', 'résultats', 'Aucun résultat')
    : plural(data.total, 'vérification publiée', 'vérifications publiées', 'Aucune vérification publiée');

  return (
    <TooltipProvider>
      <div className="grid min-h-[calc(100svh-var(--top))] lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]" ref={top}>
        <div className="min-w-0 lg:border-r">
          <header className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3 md:px-6">
            <h1 className="text-lg font-semibold tracking-tight">Fact-checks</h1>
            <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
              {countLine}{debouncedQ && searched && data.total > 0 && !data.legacy && <> pour {quote(debouncedQ)}</>}
            </p>
          </header>

          <div className="sticky top-(--top) z-20 flex flex-col gap-2.5 border-b bg-background px-4 py-2.5 md:px-6">
            <div className="flex items-center gap-1.5">
              <form method="get" action="/fact-checks" role="search" onSubmit={onSubmit} className="min-w-0 flex-1">
                <label htmlFor="q" className="sr-only">Chercher une affirmation, ou coller le lien d’un post X</label>
                <InputGroup className="h-9 border-transparent bg-muted/70 has-[[data-slot=input-group-control]:focus-visible]:bg-background">
                  <InputGroupAddon><SearchIcon /></InputGroupAddon>
                  <InputGroupInput
                    ref={input} id="q" name="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={2000}
                    autoComplete="off" spellCheck={false} placeholder={narrow ? 'Chercher' : 'Chercher ou coller un lien X'}
                  />
                  <InputGroupAddon align="inline-end">
                    {q
                      ? <InputGroupButton size="icon-xs" aria-label="Effacer la recherche" onClick={() => { setQ(''); runSearch(''); }}><CloseIcon /></InputGroupButton>
                      : <Kbd className="max-sm:hidden">/</Kbd>}
                  </InputGroupAddon>
                </InputGroup>
              </form>

              {filtersOn && (
                <DropdownMenu modal={false}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" aria-label={`Ordre${NB}: ${SORTS[sort]}`} className="text-muted-foreground">
                          <SortIcon data-icon="inline-start" />
                          <span className="max-md:hidden">{SORTS[sort]}</span>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Ordre</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Ordre</DropdownMenuLabel>
                      <DropdownMenuRadioGroup value={sort} onValueChange={(v) => { setSort(v as Sort); setPage(1); }}>
                        {(Object.keys(SORTS) as Sort[]).filter((s) => s !== 'relevance' || debouncedQ).map((s) => (
                          <DropdownMenuRadioItem key={s} value={s}>{SORTS[s]}</DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {filtersOn && (
                <AddFilterMenu keys={unused} onAdd={addFilter}>
                  <Button
                    variant="ghost" size="sm"
                    aria-label={nFilters ? `Filtrer (${nFilters} actif${nFilters > 1 ? 's' : ''})` : 'Filtrer'}
                    className={cn('text-muted-foreground', nFilters > 0 && 'bg-filter text-filter-foreground hover:bg-filter-hover hover:text-filter-foreground')}
                  >
                    <FilterIcon data-icon="inline-start" />
                    <span className="max-md:hidden">Filtrer</span>
                    {nFilters > 0 && <span className="tabular-nums">{nFilters}</span>}
                  </Button>
                </AddFilterMenu>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Actualiser" onClick={() => setNonce((n) => n + 1)} disabled={loading} className="text-muted-foreground">
                    <RefreshIcon className={cn(loading && 'animate-spin')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Actualiser</TooltipContent>
              </Tooltip>
            </div>

            {(activeKeys.length > 0 || pastedLink) && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                {pastedLink
                  ? <p className="text-[13px] text-muted-foreground">C’est un lien X{NB}: Entrée pour savoir si ce post a été vérifié.</p>
                  : <FilterChips activeKeys={activeKeys} values={values} pendingKey={pendingKey} options={options} available={available} onAdd={addFilter} onRemove={removeFilter} onPatch={patchFilter} />}
                {searched && !pastedLink && <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={clearAll}>Tout effacer</Button>}
              </div>
            )}
          </div>

          {data.failed && (
            <Alert variant="destructive" className="m-4 w-auto md:m-6">
              <CloudOffIcon />
              <AlertTitle>Les vérifications ne sont pas disponibles pour le moment.</AlertTitle>
              <AlertDescription>Le service qui les fournit ne répond pas. Réessayez dans quelques minutes.</AlertDescription>
            </Alert>
          )}
          {data.legacy && debouncedQ && (
            <Alert className="m-4 w-auto md:m-6">
              <SearchIcon />
              <AlertTitle>La recherche par mots arrive bientôt.</AlertTitle>
              <AlertDescription>Vous pouvez déjà coller le lien d’un post X pour savoir s’il a été vérifié.</AlertDescription>
            </Alert>
          )}

          {!data.failed && (
            <section aria-label="Résultats" aria-busy={loading} className={cn('transition-opacity', loading && 'opacity-60')}>
              {data.items.length > 0 && <FactCheckList items={data.items} grouped={sort !== 'relevance'} />}

              {data.items.length === 0 && (
                <Empty className="py-20">
                  <EmptyHeader>
                    <EmptyTitle>{searched && !data.legacy ? 'Aucun résultat' : page > 1 ? 'Cette page est vide' : 'Aucune vérification publiée pour l’instant'}</EmptyTitle>
                    <EmptyDescription>
                      {searched && !data.legacy ? 'Essayez un autre mot, ou retirez un filtre.' : page > 1 ? 'Il n’y a plus de vérifications après la dernière page.' : 'Elles apparaîtront ici dès leur publication.'}
                    </EmptyDescription>
                  </EmptyHeader>
                  {(searched || page > 1) && !data.legacy && (
                    <EmptyContent>
                      <Button variant="outline" size="sm" onClick={page > 1 && !searched ? () => setPage(1) : clearAll}>{page > 1 && !searched ? 'Revenir à la première page' : 'Tout effacer'}</Button>
                    </EmptyContent>
                  )}
                </Empty>
              )}

              {data.pages > 1 && <Pager page={page} pages={data.pages} href={(n) => `/fact-checks${toSearch(debouncedQ, values, activeKeys, sort, n)}`} onGo={goTo} />}
              {data.more && page === data.pages && <p className="pb-8 text-center text-sm text-muted-foreground">Pour aller plus loin, précisez la recherche ou ajoutez un filtre.</p>}
            </section>
          )}
        </div>

        {filtersOn && (
          <aside className="max-lg:hidden" aria-label="Répartition">
            <div className="sticky top-(--top) max-h-[calc(100svh-var(--top))] overflow-y-auto">
              <div className="flex min-h-14 items-center border-b px-6 py-3"><h2 className="text-sm font-semibold">Répartition</h2></div>
              <div className="px-4 py-5">
              <Facets
                counts={data.counts} typeCounts={data.typeCounts ?? {}} countryCounts={data.countryCounts ?? {}}
                veracity={values.veracity ?? []} type={values.type} country={values.country}
                onVeracity={toggleVerdict} onType={toggleOne('type')} onCountry={toggleOne('country')}
              />
              </div>
            </div>
          </aside>
        )}
      </div>
    </TooltipProvider>
  );
}

/* 1 … 4 5 [6] 7 8 … 20: real links (they work without JavaScript), handled in place when it runs. */
function Pager({ page, pages, href, onGo }: { page: number; pages: number; href: (n: number) => string; onGo: (n: number) => (e: React.MouseEvent) => void }) {
  const list: (number | '…')[] = [];
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) list.push(n);
    else if (list.at(-1) !== '…') list.push('…');
  }
  return (
    <Pagination className="py-6">
      <PaginationContent className="flex-wrap justify-center">
        {page > 1 && <PaginationItem><PaginationPrevious href={href(page - 1)} rel="prev" onClick={onGo(page - 1)} /></PaginationItem>}
        {list.map((n, i) => (
          <PaginationItem key={`${n}-${i}`}>
            {n === '…' ? <PaginationEllipsis /> : <PaginationLink href={href(n)} isActive={n === page} onClick={onGo(n)} className="tabular-nums">{n}</PaginationLink>}
          </PaginationItem>
        ))}
        {page < pages && <PaginationItem><PaginationNext href={href(page + 1)} rel="next" onClick={onGo(page + 1)} /></PaginationItem>}
      </PaginationContent>
    </Pagination>
  );
}
