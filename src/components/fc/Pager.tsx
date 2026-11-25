/*
 * Page numbers of the list (shadcn Pagination): 1 … 4 5 [6] 7 8 … 20, previous and next.
 */
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';

export function Pager({ page, pages, hrefs }: { page: number; pages: number; hrefs: Record<number, string> }) {
  const list: (number | '…')[] = [];
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 2) list.push(n);
    else if (list.at(-1) !== '…') list.push('…');
  }
  return (
    <Pagination className="mt-8">
      <PaginationContent className="flex-wrap justify-center">
        {page > 1 && <PaginationItem><PaginationPrevious href={hrefs[page - 1]} rel="prev" /></PaginationItem>}
        {list.map((n, i) => (
          <PaginationItem key={`${n}-${i}`}>
            {n === '…' ? <PaginationEllipsis /> : <PaginationLink href={hrefs[n]} isActive={n === page} className="font-mono text-xs tabular-nums">{n}</PaginationLink>}
          </PaginationItem>
        ))}
        {page < pages && <PaginationItem><PaginationNext href={hrefs[page + 1]} rel="next" /></PaginationItem>}
      </PaginationContent>
    </Pagination>
  );
}
