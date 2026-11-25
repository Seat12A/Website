/*
 * The sources of a verdict, numbered, each one a row (shadcn Item) that opens in a new tab: site, then a short path.
 * A React component (not .astro) so that Item's asChild gets a real <a>, not Astro's slot wrapper.
 */
import { ArrowUpRightIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { sourceLabel } from '@/lib/labels.js';

export function Sources({ links, title = 'Sources' }: { links: string[]; title?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="px-3">
        <ItemGroup className="gap-1">
          {links.map((s, i) => {
            const l = sourceLabel(s);
            return (
              <Item key={s} size="sm" role="listitem" asChild>
                <a href={s} rel="noopener noreferrer" target="_blank">
                  <ItemMedia className="w-6 justify-start text-xs text-muted-foreground tabular-nums">{String(i + 1).padStart(2, '0')}</ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="[overflow-wrap:anywhere]">{l.host}</ItemTitle>
                    {l.path && <ItemDescription className="line-clamp-1 [overflow-wrap:anywhere]">{l.path}</ItemDescription>}
                  </ItemContent>
                  <ItemActions className="text-muted-foreground"><ArrowUpRightIcon className="size-4" /></ItemActions>
                </a>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
