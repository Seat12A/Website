/*
 * The sources of a verdict, numbered, one row each (hairlines, like the list): site, then a short path. Opens in a new
 * tab.
 */
import { ArrowOutwardIcon } from '@/components/icons';
import { sourceLabel } from '@/lib/labels.js';

export function Sources({ links }: { links: string[] }) {
  return (
    <ol className="flex flex-col border-t">
      {links.map((s, i) => {
        const l = sourceLabel(s);
        return (
          <li key={s} className="border-b">
            <a href={s} rel="noopener noreferrer" target="_blank" className="group -mx-2 grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2 py-2.5 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/70">
              <span className="text-[13px] text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{l.host}</span>
                {l.path && <span className="block truncate text-[13px] text-muted-foreground">{l.path}</span>}
              </span>
              <ArrowOutwardIcon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </a>
          </li>
        );
      })}
    </ol>
  );
}
