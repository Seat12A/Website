/*
 * A verdict: colour, pixel icon and label, never the colour alone (docs/decisions.md). A shadcn Badge (a pill in the
 * maia style) tinted with the verdict colour (--v, from data-veracity in global.css: darker on white, lighter on the
 * night). The 7×7 pixel icon is the small reminder of the home page's pixel art.
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
        'bg-[color-mix(in_oklab,var(--v)_14%,transparent)] text-(--v)',
        size === 'lg' && 'h-8 gap-2 px-3.5 text-sm',
        className,
      )}
    >
      <PixelIcon name={v.icon} data-icon="inline-start" />
      {v.label}
    </Badge>
  );
}
