/*
 * A verdict: colour, pixel icon and label, never the colour alone (docs/decisions.md). A shadcn Badge tinted with the
 * verdict colour (--v, set from data-veracity in global.css: darker on white, lighter on the night).
 */
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VERACITY } from '@/lib/labels.js';
import { PixelIcon, type PixelIconName } from './PixelIcon';

export function VerdictBadge({ veracity, size = 'sm', className }: { veracity?: string | null; size?: 'sm' | 'lg'; className?: string }) {
  const v = veracity ? (VERACITY as Record<string, { label: string; icon: PixelIconName }>)[veracity] : null;
  if (!v) return null;
  return (
    <Badge
      data-veracity={veracity}
      className={cn(
        'rounded-md border-transparent font-medium text-[var(--v)] bg-[color-mix(in_oklab,var(--v)_13%,transparent)]',
        size === 'lg' ? 'gap-2 px-3 py-1.5 text-sm [&>svg]:size-3.5' : 'gap-1.5 px-2 py-1 text-xs [&>svg]:size-3',
        className,
      )}
    >
      <PixelIcon name={v.icon} />
      {v.label}
    </Badge>
  );
}
