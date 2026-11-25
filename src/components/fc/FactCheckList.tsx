/*
 * The fact-checks as a column of cards (shadcn Item, outline): the verdict, the date, the claim (always between
 * quotation marks: it is what the post says, not what Seat 12A says), then its type and countries. The whole card
 * opens the fact-check.
 */
import { ChevronRightIcon } from 'lucide-react';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemHeader, ItemTitle } from '@/components/ui/item';
import { CLAIM_TYPES, CONTEXT_NEED, jurisdiction, longDate, quote } from '@/lib/labels.js';
import { VerdictBadge } from './VerdictBadge';

export type ListItem = {
  public_id: string; kind: string; title: string | null; claim_type: string | null; jurisdictions?: string[];
  context_need?: string | null; veracity: string | null; verdict_state: string | null; published_at: string | null; updated_at: string;
};

const STATE: Record<string, string> = { expired: 'Peut être dépassé', superseded: 'Mis à jour depuis' };

export function FactCheckList({ items }: { items: ListItem[] }) {
  return (
    <ItemGroup className="gap-3">
      {items.map((c) => {
        const date = c.published_at ?? c.updated_at;
        const meta = [
          c.claim_type && (CLAIM_TYPES as Record<string, string>)[c.claim_type],
          ...(c.jurisdictions ?? []).map(jurisdiction),
          c.context_need && (CONTEXT_NEED as Record<string, string | null>)[c.context_need],
        ].filter(Boolean);
        const title = c.title ? quote(c.title) : c.kind === 'moderation' ? 'Modération' : 'Vérification sans titre';
        return (
          <Item key={c.public_id} variant="outline" role="listitem" asChild>
            <a href={`/fact-checks/${c.public_id}`}>
              <ItemHeader className="justify-start gap-2.5">
                {c.veracity ? <VerdictBadge veracity={c.veracity} /> : c.kind === 'moderation' && <span className="text-xs text-muted-foreground">Modération</span>}
                <time dateTime={date} className="text-xs text-muted-foreground">{longDate(date)}</time>
                {c.verdict_state && STATE[c.verdict_state] && <span className="text-xs text-muted-foreground">· {STATE[c.verdict_state]}</span>}
              </ItemHeader>
              <ItemContent>
                <ItemTitle className="line-clamp-3 text-base">{title}</ItemTitle>
                {meta.length > 0 && <ItemDescription>{meta.join(' · ')}</ItemDescription>}
              </ItemContent>
              <ItemActions className="text-muted-foreground">
                <ChevronRightIcon className="size-4 transition-transform group-hover/item:translate-x-0.5" />
              </ItemActions>
            </a>
          </Item>
        );
      })}
    </ItemGroup>
  );
}
