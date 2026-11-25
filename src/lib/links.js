/*
 * Links of the navigation bar and of the footer, shared by the home page (Nav.astro, Footer.astro) and the other pages
 * (layouts/Page.astro). `href: null` = the page does not exist yet: rendered with data-soon, a click does nothing.
 */
export const NAV = [
  { href: '/fact-checks', label: 'Fact-checks' },
  { href: null, label: 'Demander' },
  { href: null, label: 'Méthode' },
  { href: null, label: 'À propos' },
];

export const FOOTER = [
  { title: 'Seat 12A', links: [{ href: '/fact-checks', label: 'Les fact-checks' }, { href: null, label: 'Demander une vérification' }, { href: null, label: "L'extension" }] },
  { title: 'Comprendre', links: [{ href: null, label: 'Méthode' }, { href: null, label: 'Nos règles de vol' }, { href: null, label: 'Questions fréquentes' }] },
  { title: 'Le projet', links: [{ href: null, label: 'À propos' }, { href: 'https://github.com/seat12a', label: 'Le code source' }, { href: null, label: 'Nous contacter' }] },
  { title: 'Légal', links: [{ href: null, label: 'Mentions légales' }, { href: null, label: 'Confidentialité' }] },
];

/* Seat 12A has no legal status yet: never call it an association (docs/decisions.md). */
export const ABOUT = "Seat 12A vérifie et remet en contexte ce qui circule sur X, en français, sources à l'appui. Gratuit, sans publicité, et tout le code est public. Indépendant de X et de tout parti politique.";
