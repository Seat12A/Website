# Les pages des fact-checks

Ajoutées le 25/11/2026. Elles lisent l'API publique de Tower (`api-tower.md`). Pour les visiteurs, jamais « case » :
« fact-check » dans les menus et les boutons, « vérification » dans les phrases.

## Les pages

| Adresse | Fichier | Contenu |
|---|---|---|
| `/fact-checks` | `src/pages/fact-checks/index.astro` | Recherche, filtres en chips (verdict, type, pays, date), ordre, cartes, pages |
| `/fact-checks/{public_id}` | `src/pages/fact-checks/[id].astro` | L'affirmation, le verdict, la note, ce qui manque, « En savoir plus », les sources, le post, la fiche, le parcours |
| `/post/x/{id}` | `src/pages/post/[platform]/[id].astro` | « Ce post a-t-il été vérifié ? » : on y arrive en collant un lien X dans la recherche |

Les liens « Fact-checks » (menu), « Voir les fact-checks » (accueil, deux fois) et « Les fact-checks » (pied de page)
y mènent. Le reste du menu est encore en `data-soon`.

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
- **Repli** : tant que la production n'a pas `/search`, `/stats` et `/details` (voir `api-tower.md`), la liste vient de
  l'ancienne route `/v1/cases` (sans filtres : les boutons de tri et de filtre sont masqués, une recherche par mots
  affiche « arrive bientôt ») et la page d'un fact-check n'a que le titre, le lien de notre publication et le post.
  À retirer (`searchCases`, `caseDetails`) quand Tower sera à jour.
- **Le post** n'est jamais recopié (Tower ne donne ni son texte ni son auteur). Un bouton « Ouvrir sur X », et
  « Afficher le post ici » qui charge l'embed officiel de X **seulement au clic** (script de X, cookies possibles :
  c'est écrit sous le bouton).

## Les filtres en chips

Repris du système de filtres du dashboard Moddy (guide fourni par Jules le 25/11/2026). Modèle dans
`src/components/fc/filters.ts` (sans JSX), interface dans `FilterBar.tsx`, orchestration dans `FactCheckBrowser.tsx`.

- Barre d'outils : recherche (`InputGroup`, débouncée à 350 ms), boutons ronds « Actualiser » (l'icône tourne pendant
  un chargement, la liste reste affichée), « Ordre » (menu), « Filtrer » (menu des filtres pas encore utilisés ; il
  passe en bleu dès qu'un filtre a une valeur). Infobulles (`Tooltip`).
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

Demande de Jules (25/11/2026, deuxième version) : la première version shadcn était « catastrophique ». **Même en-tête
et même pied de page que l'accueil**, tout en continuité ; **composants officiels shadcn/ui, style Maia** ; **thème
bleu** en couleur d'accent ; s'inspirer de **Bluesky** (DESIGN.md fourni) ; « moderne et minimaliste ».

- **En-tête et pied de page = ceux de l'accueil** : mêmes composants (`Nav.astro` avec `solid`, `Footer.astro`), même
  CSS (`src/styles/chrome.css`, importé par `site.css` et par `global.css`). Sur ces pages la barre est d'emblée dans
  son état « défilé » (pilule bleu nuit), puisqu'il n'y a pas de ciel derrière. Le lien de la page en cours est marqué.
- **shadcn/ui** : style `radix-maia`, thème `blue` sur la base `mist`, Geist. Preset appliqué avec le CLI officiel
  (`npx shadcn@4.23.0 apply b1ZQ7FetM` ; la base `gray` est refusée par le registre). Composants dans
  `src/components/ui`. Ajouter un composant : `npx shadcn@4.23.0 add <nom>`, puis **remplacer `from "cn"` par
  `from "@/lib/utils"`** et désinstaller le paquet `cn` si le CLI l'ajoute (il le fait à chaque fois). Le paquet
  `shadcn` est en devDependency : `global.css` importe `shadcn/tailwind.css`. Icônes : lucide (celles du style).
- **Bluesky, ce qu'on a repris** : un seul bleu saturé pour l'action principale (le `primary` du thème), une encre
  ardoise froide, des filets fins, des pilules pour tout ce qui se clique, des cartes arrondies (`Card`, `Item`
  outline), pas d'ombre sur les surfaces (seuls les menus flottants en ont), une seule police dont la graisse et la
  taille font la hiérarchie (`type-display`, `type-title`). On garde Geist (continuité avec l'accueil) et non Inter.
- **Sombre** (selon l'ordinateur) : le fond est le bleu nuit `#0B1030` de l'accueil.
- **Dans un `.astro`, un composant React prend `className`, pas `class`** (sinon la classe est ignorée). Et un
  composant à `asChild` (`Item`, `Button`) doit recevoir un vrai élément : l'écrire en `.tsx` (`Sources.tsx`), car Astro
  enveloppe ses enfants dans un `astro-slot`.
- **Verdicts** (`VerdictBadge`) : pastille `Badge` teintée + pictogramme pixel 7×7 (le seul rappel pixel gardé) +
  libellé, jamais la couleur seule. Teintes hors du couple rouge/bleu politique. **À valider par Jules.**
- **L'affirmation est toujours entre guillemets** (« … », espaces insécables). Espace insécable avant les deux-points.
- Dates et heures à l'heure de Paris, en français.

## Vérifier

```bash
node tools/pages.js                                    # pages principales, données de test, 1280×800
LARGEUR=390 HAUTEUR=844 node tools/pages.js            # téléphone
node tools/pages.js "/fact-checks?q=prix&veracity=mostly_true"
SOMBRE=1 node tools/pages.js                          # ordinateur en mode sombre
REEL=1 node tools/pages.js /fact-checks                # la vraie API
node tools/filtres.js                                  # clique dans les filtres en chips, captures et erreurs
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
