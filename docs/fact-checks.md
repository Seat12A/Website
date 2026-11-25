# Les pages des fact-checks

Ajoutées le 25/11/2026. Elles lisent l'API publique de Tower (`api-tower.md`). Pour les visiteurs, jamais « case » :
« fact-check » dans les menus et les boutons, « vérification » dans les phrases.

## Les pages

| Adresse | Fichier | Contenu |
|---|---|---|
| `/fact-checks` | `src/pages/fact-checks/index.astro` | Recherche, filtres en chips (verdict, type, pays, date), ordre, lignes groupées par mois, colonne de répartition, pages |
| `/fact-checks/{public_id}` | `src/pages/fact-checks/[id].astro` | L'affirmation, le verdict, la note, ce qui manque, « En savoir plus », les sources, le post (chargé tout seul), les détails, l'historique |
| `/post/x/{id}` | `src/pages/post/[platform]/[id].astro` | « Ce post a-t-il été vérifié ? » : on y arrive en collant un lien X dans la recherche |

Les liens « Fact-checks » (menu), « Voir les fact-checks » (accueil, deux fois) y mènent. Le reste du menu est encore en `data-soon`.

## Comment c'est rendu

- **Rendu côté serveur** (adaptateur `@astrojs/vercel`, `export const prerender = false`) ; l'accueil et la 404 restent
  statiques. **Le navigateur n'appelle jamais Tower** : pas de CORS, rien d'exposé.
- **La liste** (`/fact-checks`) : premier rendu sur le serveur avec les filtres de l'adresse (`src/lib/factchecks.js`),
  puis la recherche et les filtres tournent dans le navigateur (îlot React `FactCheckBrowser.tsx`, `client:load`). Chaque
  changement appelle **`/api/fact-checks`** (`src/pages/api/fact-checks.ts`, même code serveur, même cache) et met à
  jour l'adresse (`replaceState`) : une liste filtrée se partage par lien et survit au rechargement. Sans JavaScript, la
  recherche reste un formulaire GET et les filtres de l'adresse s'appliquent.
- **Paramètres de l'adresse** : `q`, `veracity` (répétable), `claim_type`, `jurisdiction`, `date` (préréglage : `today`,
  `yesterday`, `thisWeek`, `last7`, `last30`, `thisMonth`) ou `since`/`until` (AAAA-MM-JJ, jours inclus ; converti en
  `until` exclu pour l'API), `sort`, `page`. L'ordre des paramètres = l'ordre des chips. Les préréglages sont calculés
  sur le serveur, en jours de Paris.
- Les pages d'un fact-check et d'un post n'envoient **aucun React** au navigateur (pas de `client:*`).
- **Cache** : `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=3600` (5 minutes au CDN de Vercel) ;
  60 s pour une 404 ; rien pour une erreur. Réglage dans `src/lib/tower.js`.
- **Erreurs** : case inconnu ou non publié → vraie 404 ; Tower ne répond pas → 503 avec un message simple (`Alert`).
  Les valeurs de filtres inconnues sont ignorées avant l'appel (pas de 422).
- **Repli** : la production sert `/search`, `/stats` et `/details` depuis le 25/11/2026 au soir (vérifié). Tant
  qu'une instance ne les a pas (voir `api-tower.md`), la liste vient de
  l'ancienne route `/v1/cases` (sans filtres : les boutons de tri et de filtre sont masqués, une recherche par mots
  affiche « arrive bientôt ») et la page d'un fact-check n'a que le titre, le lien de notre publication et le post.
  À retirer (`searchCases`, `caseDetails`) quand Tower sera à jour.
- **Le post** n'est jamais recopié (Tower ne donne ni son texte ni son auteur) : l'embed officiel de X **se charge
  tout seul** (Jules, 25/11/2026 ; avant, seulement au clic). `widgets.js` vient de X et peut déposer des cookies :
  c'est écrit sous le post. **Point juridique à vérifier** : en France, des cookies tiers déposés sans consentement
  posent problème (CNIL). Si X bloque ou ne répond pas, un lien « Ouvrir sur X » reste.

## Les filtres en chips

Repris du système de filtres du dashboard Moddy (guide fourni par Jules le 25/11/2026). Modèle dans
`src/components/fc/filters.ts` (sans JSX), interface dans `FilterBar.tsx`, orchestration dans `FactCheckBrowser.tsx`.

- Barre d'outils : recherche (`InputGroup`, débouncée à 350 ms, `/` pour y aller), « Ordre » (menu), « Filtrer » (menu
  des filtres pas encore utilisés ; bleu avec le nombre de filtres dès qu'un filtre a une valeur), « Actualiser »
  (l'icône tourne pendant un chargement, la liste reste affichée). La colonne de répartition ajoute aussi des chips.
- Filtres : **Verdict** (plusieurs, cases à cocher avec les comptes de `stats`), **Type**, **Pays** (un choix, la liste
  vient de `stats`), **Date** (préréglages ou plage personnalisée).
- Règles : ajouter un filtre ouvre son éditeur ; un éditeur fermé sans valeur supprime son chip ; un choix unique
  ferme l'éditeur (pas les verdicts ni la plage) ; chaque filtre une seule fois ; ordre d'ajout conservé ; « Retirer
  le filtre » en bas de chaque éditeur ; « Tout effacer » à côté du compte.
- **Piège** : le clic qui choisit un filtre dans le menu est vu par le nouveau Popover comme un clic extérieur. Ouverture
  retardée de 160 ms, fermetures ignorées pendant 250 ms après une ouverture, `DropdownMenu modal={false}`.
- Couleur des chips actifs : jetons `--filter*` dans `global.css` (teinte du bleu du thème, mélangée **en OKLab** :
  en OKLCH, le mélange avec le blanc tirait vers le rose).
- Un lien X collé n'est pas une recherche : un message propose Entrée, qui ouvre `/post/x/{id}`.

## Design

Historique (25/11/2026) : une version « tableau des arrivées » ; puis une version shadcn jugée « catastrophique » ; puis
Maia + thème bleu avec en-tête et pied de page de l'accueil ; enfin la version actuelle, demandée par Jules : **sans
pied de page, en pleine largeur, embed X automatique, sans cartes à contour, icônes Material, sans icônes pixel, un
mélange de Bluesky, Twitter et Linear, plus fonctionnel, sans ce qui fait IA**.

- **En-tête = celui de l'accueil** (`Nav.astro` avec `solid`, `src/styles/chrome.css`). Une bande de la couleur de la
  page est fixée derrière lui (`layouts/Page.astro`) ; `--top` (82 px, `global.css`) est la hauteur sous cette bande :
  la barre d'outils, la barre du haut d'un fact-check et la colonne de droite s'y collent. **Pas de pied de page.**
- **Pleine largeur**, avec une petite marge de chaque côté (12 à 32 px, `layouts/Page.astro` : rien ne colle au bord,
  demandé par Jules) : la liste ou le texte à gauche, une colonne de 19 à 28 rem à droite, séparées par un filet
  vertical (comme les colonnes de Twitter). Le texte remplit sa colonne (pas de largeur maximale : refusé).
- **Liste** (Linear) : titre court avec le compte, barre d'outils collante (recherche sur fond gris sans contour avec
  le raccourci `/`, ordre, filtrer, actualiser), lignes séparées par des filets, survol gris, groupes par mois avec leur
  compte quand on trie par date. À droite, la **répartition** par verdict, type et pays (comptes de `stats`, chaque
  ligne filtre ; les comptes d'une facette ignorent son propre filtre, d'où trois appels à `stats`).
- **Fact-check** : barre du haut (retour, fil d'Ariane, « Copier le lien », « Notre publication »), verdict, affirmation
  (plus petite au-delà de 110 caractères), puis des sections sans cartes : « Ce qu'il faut savoir », « En savoir plus » et « Sources » ont un vrai titre (18 px)
  et un texte de couleur normale (« En savoir plus » doit être mis en avant, Jules) ; « Ce qui manque au post » garde un
  petit titre gris. À droite : le post, les
  détails (libellé / valeur, comme les propriétés de Linear), l'historique en frise.
- **shadcn/ui** : style `radix-maia`, thème `blue` sur la base `mist`, Geist (vérifié : c'est bien Geist qui s'affiche).
  Preset appliqué avec le CLI (`npx shadcn@4.23.0 apply b1ZQ7FetM` ; la base `gray` est refusée). Ajouter un
  composant : `npx shadcn@4.23.0 add <nom> < /dev/null` (sans entrée, le CLI peut attendre une réponse), puis
  **remplacer `from "cn"` par `from "@/lib/utils"`** et `npm uninstall cn` (le CLI les ajoute à chaque fois).
  `shadcn` est en devDependency (`global.css` importe `shadcn/tailwind.css`).
- **Icônes : Google Material Symbols** (Rounded, 400), depuis npm (`@material-symbols/svg-400`), jamais d'un CDN.
  `src/components/icons.tsx` n'importe que les icônes utilisées (`?raw`) et en fait des composants ; les composants
  shadcn (checkbox, menu, pagination) les utilisent aussi. Ajouter une icône : l'importer là. **Plus d'icônes pixel.**
- **Verdicts** (`VerdictBadge`) : pastille teintée + icône Material de forme différente pour chacun (coche pleine,
  coche ronde, point d'exclamation, croix, point d'interrogation) + libellé, jamais la couleur seule. Teintes hors du
  couple rouge/bleu politique. **À valider par Jules.**
- **Dans un `.astro`, un composant React prend `className`, pas `class`.** Un composant à `asChild` doit recevoir un
  vrai élément : l'écrire en `.tsx`, car Astro enveloppe ses enfants dans un `astro-slot`.
- Tower coupe `title` à 200 caractères : la liste ajoute « … » (`title()` dans `labels.js`).
- L'affirmation toujours entre guillemets ; espace insécable avant les deux-points ; dates à l'heure de Paris.

## Vérifier

```bash
node tools/pages.js                                    # pages principales, données de test, 1280×800
LARGEUR=390 HAUTEUR=844 node tools/pages.js            # téléphone
node tools/pages.js "/fact-checks?q=prix&veracity=mostly_true"
SOMBRE=1 node tools/pages.js                          # ordinateur en mode sombre
REEL=1 node tools/pages.js /fact-checks                # la vraie API
node tools/filtres.js                                  # clique dans les filtres en chips, captures et erreurs
REEL=1 ATTENTE=7000 node tools/pages.js /fact-checks/… # laisser le temps à l'embed X de s'afficher
```

`tools/pages.js` lance `astro dev` et, sauf avec `REEL=1`, un faux Tower local (`tools/tower-mock.js`). Ses
fact-checks sont **inventés pour la mise en page** (les exemples de la doc de l'API) et ne sont jamais servis aux
visiteurs. Pas besoin de `npm run build` avant.

## Pas encore fait

- Badges (légende, vérifier un compte, demander un badge, signaler un badge erroné) : l'API est prête (§ 5).
- Derniers fact-checks et chiffres sur l'accueil, page de statistiques (`/stats`).
- Le formulaire « Un doute ? Posez la question » de l'accueil ne fait toujours rien : il est prévu pour le chatbot. On
  pourrait l'envoyer vers `/fact-checks?q=…` (un lien collé y mène au verdict du post), mais alors son texte (« On
  cherche les sources, et on vous dit aussi quand on ne sait pas ») ne serait plus vrai. À décider.
- Image Open Graph des fact-checks.
