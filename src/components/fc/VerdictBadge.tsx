/*
 * A verdict: colour, icon (Material Symbols, a different shape for each) and label, never the colour alone
 * (docs/decisions.md). A shadcn Badge tinted with the verdict colour (--v, from data-veracity in global.css: darker on
 * white, lighter on the night).
 */
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VERACITY } from '@/lib/labels.js';
import {
  VerdictFalseIcon, VerdictMisleadingIcon, VerdictMostlyTrueIcon, VerdictTrueIcon, VerdictUnverifiableIcon, type Icon,
} from '@/components/icons';

export const VERDICT_ICONS: Record<string, Icon> = {
  true: VerdictTrueIcon,
  mostly_true: VerdictMostlyTrueIcon,
  misleading: VerdictMisleadingIcon,
  false: VerdictFalseIcon,
  unverifiable: VerdictUnverifiableIcon,
};

export function VerdictBadge({ veracity, size = 'sm', className }: { veracity?: string | null; size?: 'sm' | 'lg'; className?: string }) {
  const v = veracity ? (VERACITY as Record<string, { label: string }>)[veracity] : null;
  if (!v || !veracity) return null;
  const Icon = VERDICT_ICONS[veracity];
  return (
    <Badge
      data-veracity={veracity}
      className={cn(
        'bg-[color-mix(in_oklab,var(--v)_13%,transparent)] text-(--v)',
        size === 'lg' && 'h-7 gap-1.5 px-3 text-[13px] [&>svg]:size-4!',
        className,
      )}
    >
      <Icon data-icon="inline-start" />
      {v.label}
    </Badge>
  );
}
