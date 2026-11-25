/*
 * The list of /fact-checks with its search and its filter chips (a React island, client:load). First render on the
 * server with the data of the address; after that, each change asks /api/fact-checks (which asks Tower) and updates
 * the address (replaceState), so a filtered list can be shared and survives a reload.
 *
 * Toolbar: the search (debounced 350 ms), refresh, order, filter (blue as soon as a filter has a value). Under it, the
 * chips (FilterBar.tsx). While a new page loads, the current list stays and the refresh icon spins. A pasted X link is
 * not a search: Enter opens /post/x/{id} ("has this post been checked?"). Without JavaScript the search still works
 * (a plain GET form) and the address's filters still apply.
 */
import * as React from 'react';
import { ArrowDownUpIcon, ListFilterIcon, RefreshCwIcon, SearchIcon, SearchXIcon, ServerOffIcon, XIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { plural, quote, xPostId } from '@/lib/labels.js';
import { AddFilterMenu, FilterChips } from './FilterBar';
import { FactCheckList, type ListItem } from './FactCheckList';
import { FILTER_KEYS, SORTS, clearFilter, countFilters, toSearch, type FilterKey, type FilterValues, type Sort } from './filters';

export type ListData = {
  failed: boolean; legacy: boolean; items: ListItem[]; total: number; page: number; pages: number; more: boolean;
  counts: Record<string, number> | null; types: string[]; countries: string[];
};
export type InitialState = { q: string; values: FilterValues; activeKeys: FilterKey[]; sort: Sort; page: number };

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
  const listTop = React.useRef<HTMLDivElement>(null);
  const first = React.useRef(true);

  /* search debounced at 350 ms; a new search starts at page 1 with the default order */
  React.useEffect(() => {
    const id = setTimeout(() => {
      const next = q.trim().replace(/\s+/g, ' ');
      if (next === debouncedQ || xPostId(next)) return;
      setDebouncedQ(next); setPage(1); setSort(next ? 'relevance' : 'newest');
    }, 350);
    return () => clearTimeout(id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const addFilter = (k: FilterKey) => {
    if (!activeKeys.includes(k)) setActiveKeys((prev) => [...prev, k]);
    setPendingKey(k);
  };
  const removeFilter = React.useCallback((k: FilterKey) => {
    setActiveKeys((prev) => prev.filter((x) => x !== k));
    setValues((prev) => clearFilter(k, prev));
    setPendingKey((p) => (p === k ? null : p));
    setPage(1);
  }, []);
  const patchFilter = (patch: Partial<FilterValues>) => { setValues((prev) => ({ ...prev, ...patch })); setPage(1); };
  const clearAll = () => { setActiveKeys([]); setValues({}); setQ(''); setDebouncedQ(''); setSort('newest'); setPage(1); };
  const goTo = (n: number) => (e: React.MouseEvent) => {
    e.preventDefault(); setPage(n);
    listTop.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = xPostId(q);
    if (id) { location.assign(`/post/x/${id}`); return; }
    setDebouncedQ(q.trim().replace(/\s+/g, ' '));
  };

  const filtersOn = !data.legacy && !data.failed;
  const available = filtersOn ? FILTER_KEYS : [];
  const unused = available.filter((k) => !activeKeys.includes(k));
  const nFilters = countFilters(values, activeKeys);
  const searched = !!debouncedQ || nFilters > 0;
  const pastedLink = !!xPostId(q);
  const options = { counts: data.counts, types: data.types, countries: data.countries };

  const countLine = data.failed ? '' : searched && !data.legacy
    ? plural(data.total, 'vérification correspond', 'vérifications correspondent', 'Aucune vérification ne correspond')
    : plural(data.total, 'vérification publiée', 'vérifications publiées', 'Aucune vérification publiée pour l’instant');

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3" ref={listTop}>
        <div className="flex items-center gap-2">
          <form method="get" action="/fact-checks" role="search" onSubmit={onSubmit} className="min-w-0 flex-1">
            <label htmlFor="q" className="sr-only">Chercher une affirmation, ou coller le lien d’un post X</label>
            <InputGroup className="h-10">
              <InputGroupAddon><SearchIcon /></InputGroupAddon>
              <InputGroupInput
                id="q" name="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={2000}
                autoComplete="off" spellCheck={false} placeholder="Chercher, ou coller un lien X"
              />
              {q && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="icon-xs" aria-label="Effacer la recherche" onClick={() => { setQ(''); setDebouncedQ(''); setSort('newest'); setPage(1); }}><XIcon /></InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          </form>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon-lg" aria-label="Actualiser" onClick={() => setNonce((n) => n + 1)} disabled={loading}>
                <RefreshCwIcon className={cn(loading && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Actualiser</TooltipContent>
          </Tooltip>

          {filtersOn && (
            <DropdownMenu modal={false}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon-lg" aria-label={`Ordre : ${SORTS[sort]}`}><ArrowDownUpIcon /></Button>
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
                variant="outline" size="icon-lg" aria-label={nFilters ? `Filtrer (${nFilters} actif${nFilters > 1 ? 's' : ''})` : 'Filtrer'}
                className={cn(nFilters > 0 && 'border-filter-border bg-filter text-filter-foreground hover:bg-filter-hover hover:text-filter-foreground')}
              >
                <ListFilterIcon />
              </Button>
            </AddFilterMenu>
          )}
        </div>

        {pastedLink && <p className="px-1 text-sm text-muted-foreground">C’est un lien X : appuyez sur Entrée pour savoir si ce post a été vérifié.</p>}

        <FilterChips
          activeKeys={activeKeys} values={values} pendingKey={pendingKey} options={options} available={available}
          onAdd={addFilter} onRemove={removeFilter} onPatch={patchFilter}
        />

        {data.failed && (
          <Alert className="mt-4">
            <ServerOffIcon />
            <AlertTitle>Les vérifications ne sont pas disponibles pour le moment.</AlertTitle>
            <AlertDescription>Le service qui les fournit ne répond pas. Réessayez dans quelques minutes.</AlertDescription>
          </Alert>
        )}
        {data.legacy && debouncedQ && (
          <Alert className="mt-4">
            <SearchIcon />
            <AlertTitle>La recherche par mots arrive bientôt.</AlertTitle>
            <AlertDescription>Vous pouvez déjà coller le lien d’un post X pour savoir s’il a été vérifié.</AlertDescription>
          </Alert>
        )}

        {!data.failed && (
          <section aria-label="Résultats" aria-busy={loading} className={cn('mt-5 flex flex-col gap-4 transition-opacity', loading && 'opacity-60')}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-1">
              <p className="text-sm text-muted-foreground" aria-live="polite">{countLine}{debouncedQ && searched && data.total > 0 && !data.legacy && <> pour {quote(debouncedQ)}</>}</p>
              {searched && !data.legacy && <Button variant="link" size="xs" className="px-0" onClick={clearAll}>Tout effacer</Button>}
            </div>

            {data.items.length > 0 && <FactCheckList items={data.items} />}

            {data.items.length === 0 && (
              <Empty className="rounded-3xl border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><SearchXIcon /></EmptyMedia>
                  <EmptyTitle>{searched && !data.legacy ? 'Rien ne correspond' : page > 1 ? 'Cette page est vide' : 'Les premières vérifications arrivent bientôt'}</EmptyTitle>
                  <EmptyDescription>
                    {searched && !data.legacy ? 'Essayez un autre mot, ou retirez un filtre.' : page > 1 ? 'Il n’y a plus de vérifications après la dernière page.' : 'Dès qu’une vérification est publiée, elle apparaît ici.'}
                  </EmptyDescription>
                </EmptyHeader>
                {(searched || page > 1) && !data.legacy && (
                  <EmptyContent><Button variant="outline" onClick={page > 1 && !searched ? () => setPage(1) : clearAll}>{page > 1 && !searched ? 'Revenir à la première page' : 'Tout effacer'}</Button></EmptyContent>
                )}
              </Empty>
            )}

            {data.pages > 1 && <Pager page={page} pages={data.pages} href={(n) => `/fact-checks${toSearch(debouncedQ, values, activeKeys, sort, n)}`} onGo={goTo} />}
            {data.more && page === data.pages && <p className="text-center text-sm text-muted-foreground">Pour aller plus loin, précisez la recherche ou ajoutez un filtre.</p>}
          </section>
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
    <Pagination className="mt-4">
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
