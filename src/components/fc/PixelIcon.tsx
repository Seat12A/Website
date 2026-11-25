/*
 * Small icons drawn on a 7×7 cell grid, rendered as crisp SVG squares: the pixel reminder of the home page, kept small.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

/* '#' = filled cell, row by row */
const GRIDS = {
  check: ['.......', '......#', '.....##', '#...##.', '##.##..', '.###...', '..#....'],
  'check-part': ['.......', '.......', '.....#.', '#...##.', '##.##..', '.###...', '..#....'],
  half: ['..###..', '.#.####', '#..####', '#..####', '#..####', '.#.####', '..###..'],
  cross: ['##...##', '###.###', '.#####.', '..###..', '.#####.', '###.###', '##...##'],
  question: ['.#####.', '##...##', '.....##', '...###.', '...##..', '.......', '...##..'],
  'arrow-right': ['...#...', '....#..', '.....#.', '######.', '.....#.', '....#..', '...#...'],
  'arrow-left': ['...#...', '..#....', '.#.....', '.######', '.#.....', '..#....', '...#...'],
  'chevron-down': ['.......', '.......', '#.....#', '.#...#.', '..#.#..', '...#...', '.......'],
  'arrow-out': ['..#####', '....###', '...#..#', '..#...#', '.#.....', '#......', '.......'],
  search: ['.###...', '#...#..', '#...#..', '#...#..', '.####..', '....##.', '.....##'],
} as const;

export type PixelIconName = keyof typeof GRIDS;

export function PixelIcon({ name, className, ...props }: { name: PixelIconName } & React.ComponentProps<'svg'>) {
  const cells: [number, number][] = [];
  GRIDS[name].forEach((row, y) => [...row].forEach((c, x) => c === '#' && cells.push([x, y])));
  return (
    <svg viewBox="0 0 7 7" aria-hidden="true" className={cn('pixel size-3.5', className)} {...props}>
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)}
    </svg>
  );
}
