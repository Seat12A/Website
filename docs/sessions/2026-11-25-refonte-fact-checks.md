# Session du 25/11/2026 — refonte des pages des fact-checks

## Demandes de Jules

« Au niveau du design, c'est absolument catastrophique. » Le header doit être **le même que sur la page d'accueil**,
tout doit être **en continuité** dans le site. **Composants officiels shadcn/ui, style Maia**, avec le **thème bleu**
en couleur d'accent, en suivant le skill officiel de shadcn pour les agents. S'inspirer du **design de Bluesky**
(DESIGN.md fourni). Pour les filtres, le **système de chips du dashboard Moddy** (guide fourni). « Moderne et
minimaliste. »

## Ce qui a été fait

- **En-tête et pied de page partagés** : la barre de navigation, les boutons à reflet pixel, les liens en pointillés
  et le pied de page sortis de `site.css` dans `src/styles/chrome.css`, importé par l'accueil et par `global.css`.
  `Nav.astro` prend `solid` (barre d'emblée en pilule bleu nuit sur les autres pages) et `current` ; `Footer.astro`
  prend `home` (« Redécoller » sur l'accueil, « Retour à l'accueil » ailleurs). Rendu de l'accueil vérifié inchangé.
- **shadcn/ui Maia + thème bleu** : preset `b1ZQ7FetM` (radix, maia, blue, base mist, Geist) appliqué avec le CLI
  officiel. Composants ajoutés : popover, dropdown-menu, tooltip, input-group, item, empty, alert, card, field,
  checkbox, label (textarea vient avec input-group) ; table et native-select, inutilisés, retirés. Le CLI importe `cn` depuis un paquet `cn` : remis
  sur `@/lib/utils` et paquet retiré. Pagination traduite.
- **Thème** (`global.css`) réécrit : jetons du preset en clair, bleu nuit `#0B1030` en sombre, jetons `--filter*`
  pour les chips, échelle `type-display` / `type-title`.
- **Liste** : îlot React `FactCheckBrowser.tsx` (recherche débouncée, actualiser, ordre, filtres en chips,
  `FilterBar.tsx` + `filters.ts`), cartes `Item` (`FactCheckList.tsx`), `Empty`, `Alert`, `Pagination`. Nouvelle route
  `/api/fact-checks` et code serveur commun `src/lib/factchecks.js`. Filtre de date (préréglages, plage) ajouté ; les
  filtres vivent dans l'adresse. Supprimés : `CasesTable`, `SearchForm`, `Pager`.
- **Fact-check et post** : en `Card`, `Badge`, `Alert`, `Empty` ; sources en `Item` (`Sources.tsx`) ; retour en
  bouton fantôme (`BackLink.astro`) ; `SearchBox.tsx` sur la page d'un post non vérifié ; `PostEmbed` en boutons.
- Faux Tower : gère `since`/`until`. Nouvel outil `tools/filtres.js` (clique dans les chips).
- Docs : `fact-checks.md`, `decisions.md`, `CLAUDE.md`.

## Vérifié

- `npm run build` sans erreur. Captures en clair et en sombre (1280) et au téléphone (390) : liste, fact-check, post
  vérifié et non vérifié, fact-check introuvable ; accueil aux points 0 et 1 (inchangé).
- `tools/filtres.js` : l'éditeur s'ouvre à l'ajout, un chip fermé vide disparaît, l'adresse suit
  (`?veracity=false&veracity=misleading&date=last7`), les chips reviennent au rechargement, aucune erreur console.
- Non vérifié : à l'œil et au clavier sur un vrai navigateur (Jules), contre la vraie API (la production n'a pas encore
  `search`/`stats` : les filtres y sont masqués), le déploiement Vercel de la nouvelle route `/api/fact-checks`.

## Points à valider par Jules

- Le bleu du thème (shadcn « blue ») à côté du bleu nuit de l'en-tête.
- Les icônes lucide dans les pages (le pixel ne reste que sur les verdicts).
- Les champs de date sont ceux du navigateur (aspect variable ; jj/mm/aaaa sur un navigateur en français).
