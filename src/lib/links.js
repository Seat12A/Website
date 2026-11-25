/*
 * Links of the navigation bar, shared by the home page and the other pages (Nav.astro). `href: null` = the page does not exist yet: rendered with data-soon, a click does nothing.
 */
export const NAV = [
  { href: '/fact-checks', label: 'Fact-checks' },
  { href: null, label: 'Demander' },
  { href: null, label: 'Méthode' },
  { href: null, label: 'À propos' },
];
