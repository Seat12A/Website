/*
 * A plain search form towards /fact-checks (works without JavaScript): used where the full list is not shown, e.g.
 * on the page of a post that has not been checked. A pasted X link redirects to that post's page (fact-checks/index).
 */
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

export function SearchBox({ label }: { label: string }) {
  return (
    <form method="get" action="/fact-checks" role="search" className="flex gap-2 max-sm:flex-col">
      <label htmlFor="q" className="sr-only">{label}</label>
      <InputGroup className="h-10 flex-1">
        <InputGroupAddon><SearchIcon /></InputGroupAddon>
        <InputGroupInput id="q" name="q" type="search" maxLength={2000} autoComplete="off" spellCheck={false} placeholder={label} />
      </InputGroup>
      <Button type="submit" size="lg">Chercher</Button>
    </form>
  );
}
