/*
 * The list of fact-checks as a shadcn Table: date, the claim (always between quotation marks: it is what the post says,
 * not what Seat 12A says), its type and countries, the verdict. The whole row opens the fact-check. On a phone the
 * rows become stacked blocks.
 */
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CLAIM_TYPES, CONTEXT_NEED, jurisdiction, quote, shortDate } from '@/lib/labels.js';
import { PixelIcon } from './PixelIcon';
import { VerdictBadge } from './VerdictBadge';

type Item = {
  public_id: string; kind: string; title: string | null; claim_type: string | null; jurisdictions?: string[];
  context_need?: string | null; veracity: string | null; verdict_state: string | null; published_at: string | null; updated_at: string;
};

export function CasesTable({ items, caption }: { items: Item[]; caption: string }) {
  return (
    <Table className="max-md:block [&_tbody]:max-md:block [&_tr]:max-md:grid">
      <caption className="sr-only">{caption}</caption>
      <TableHeader className="max-md:hidden">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-28 font-mono text-xs font-normal text-muted-foreground">Publié le</TableHead>
          <TableHead className="font-mono text-xs font-normal text-muted-foreground">Affirmation vérifiée</TableHead>
          <TableHead className="w-40 font-mono text-xs font-normal text-muted-foreground">Verdict</TableHead>
          <TableHead className="w-8"><span className="sr-only">Ouvrir</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((c) => {
          const date = c.published_at ?? c.updated_at;
          const meta = [
            c.claim_type && (CLAIM_TYPES as Record<string, string>)[c.claim_type],
            ...(c.jurisdictions ?? []).map(jurisdiction),
            c.context_need && (CONTEXT_NEED as Record<string, string | null>)[c.context_need],
          ].filter(Boolean);
          const title = c.title ? quote(c.title) : c.kind === 'moderation' ? 'Modération' : 'Vérification sans titre';
          return (
            <TableRow key={c.public_id} className="group relative max-md:grid-cols-[1fr_auto] max-md:gap-x-3 max-md:gap-y-2 max-md:py-4 has-[a:focus-visible]:bg-muted/60">
              <TableCell className="align-top py-4 font-mono text-[13px] text-muted-foreground tabular-nums max-md:p-0 max-md:self-center">
                <time dateTime={date}>{shortDate(date)}</time>
              </TableCell>
              <TableCell className="align-top py-4 whitespace-normal max-md:col-span-2 max-md:row-start-2 max-md:p-0">
                <a href={`/fact-checks/${c.public_id}`} className="text-base leading-snug font-medium outline-none after:absolute after:inset-0 focus-visible:underline">
                  {title}
                </a>
                {meta.length > 0 && <span className="mt-1 block text-sm text-muted-foreground">{meta.join(' · ')}</span>}
              </TableCell>
              <TableCell className="align-top py-4 max-md:col-start-2 max-md:row-start-1 max-md:p-0 max-md:text-right">
                {c.veracity ? <VerdictBadge veracity={c.veracity} /> : <span className="font-mono text-xs text-muted-foreground">{c.kind === 'moderation' ? 'Modération' : ''}</span>}
                {c.verdict_state === 'expired' && <span className="mt-1.5 block font-mono text-[11px] text-muted-foreground">Peut être dépassé</span>}
                {c.verdict_state === 'superseded' && <span className="mt-1.5 block font-mono text-[11px] text-muted-foreground">Mis à jour depuis</span>}
              </TableCell>
              <TableCell className="align-top py-4 text-muted-foreground max-md:hidden">
                <PixelIcon name="arrow-right" className="mt-1 transition-transform duration-200 ease-[steps(2)] group-hover:translate-x-1 group-hover:text-foreground" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
