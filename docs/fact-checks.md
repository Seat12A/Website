# Les pages des fact-checks

Ajoutées le 25/11/2026. Elles lisent l'API publique de Tower (`api-tower.md`). Pour les visiteurs, jamais « case » :
« fact-check » dans les menus et les boutons, « vérification » dans les phrases.

## Les pages

| Adresse | Fichier | Contenu |
|---|---|---|
| `/fact-checks` | `src/pages/fact-checks/index.astro` | Recherche, filtres (verdict avec comptes, type, pays, ordre), tableau, pages |
| `/fact-checks/{public_id}` | `src/pages/fact-checks/[id].astro` | L'affirmation, le verdict, la note, ce qui manque, « En savoir plus », les sources, le post, la fiche, le parcours |
| `/post/x/{id}` | `src/pages/post/[platform]/[id].astro` | « Ce post a-t-il été vérifié ? » : on y arrive en collant un lien X dans la recherche |

Les liens « Fact-checks » (menu), « Voir les fact-checks » (accueil, deux fois) et « Les fact-checks » (pied de page)
y mènent. Le reste du menu est encore en `data-soon`.

## Comment c'est rendu

- **Rendu côté serveur** (adaptateur `@astrojs/vercel`, `export const prerender = false` dans ces pages) ; l'accueil et
  la 404 restent statiques. Le navigateur n'appelle jamais Tower : pas de CORS à régler pour les domaines de
  prévisualisation de Vercel, rien d'exposé, et les pages sont lisibles sans JavaScript (les filtres sont un simple
  formulaire GET ; un petit script l'envoie quand un filtre change et retire les champs vides de l'adresse).
- **Cache** : `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=3600` (le CDN de Vercel garde la
  page 5 minutes, comme Tower) ; 60 s pour une 404 ; rien pour une erreur. Réglage dans `src/lib/tower.js`.
- **Erreurs** : case inconnu ou non publié → vraie 404 ; Tower ne répond pas → 503 avec un message simple. Les valeurs
  de filtres inconnues sont ignorées avant l'appel (pas de 422).
- **Repli** : tant que la production n'a pas `/search`, `/stats` et `/details` (voir `api-tower.md`), la liste vient de
  l'ancienne route `/v1/cases` (sans filtres : ils sont masqués, et une recherche par mots affiche « pas encore
  disponible ») et la page d'un fact-check n'a que le titre, le lien de notre publication et le post. À retirer
  (`searchCases`, `caseDetails`) quand Tower sera à jour.
- **Le post** n’est jamais recopié (Tower ne donne ni son texte ni son auteur). Un lien « Ouvrir sur X », et un bouton
  « Afficher le post ici » qui charge l'embed officiel de X **seulement au clic** (script de X, cookies possibles :
  c'est écrit sous le bouton). Aucune requête vers X au chargement de la page.

## Design

Demande de Jules (25/11/2026) : **minimaliste mais cool, shadcn/ui obligatoire, mode clair par défaut et sombre si
l'ordinateur l'est, de petits rappels au pixel, pas de style avion recopié, la même typo que l'accueil**. Une première
version sombre « tableau des arrivées » a été faite puis remplacée le jour même.

- **shadcn/ui** (style new-york, `components.json`) avec Tailwind 4 et React. Composants dans `src/components/ui`
  (button, badge, input, table, separator, pagination, native-select). Les icônes lucide de `native-select` et
  `pagination` ont été remplacées par des icônes pixel, et les textes de la pagination traduits. Ajouter un composant :
  `npx shadcn@4.23.0 add <nom>`, puis remplacer `from "cn"` par `from "@/lib/utils"` si le CLI se trompe (c'est arrivé).
- Les composants des pages sont en React (`src/components/fc`) : `CasesTable`, `SearchForm`, `Pager`, `VerdictBadge`,
  `PixelIcon`. **Rendus sur le serveur, aucun React envoyé au navigateur** (pas de `client:*`). Dans un `.astro`, ne
  pas mettre d'enfants Astro dans un composant React de tableau (Astro les enveloppe dans un élément qui casse le
  `<table>`) : passer les données en props. Avec `badgeVariants` ou `buttonVariants` utilisés à la main, passer par
  `cn()` pour que les classes en conflit soient résolues.
- **Thème** (`src/styles/global.css`) : jetons shadcn ; clair par défaut ; sombre par `prefers-color-scheme` (pas de
  bouton). Le bleu nuit de l'accueil `#0B1030` sert d'encre en clair et de fond en sombre : c'est la continuité.
  Geist et Geist Mono (Fontsource), comme l'accueil. Tailwind n'est chargé que sur ces pages, l'accueil garde
  `site.css` et `home.css`.
- **Rappels pixel** (petits, exprès) : pictogrammes 7×7 (verdicts, flèches, loupe, chevron), points carrés (filtres,
  historique, « ce qui manque »), une ligne tramée sous l'en-tête, les liens en pointillés qui avancent par crans
  comme sur l'accueil, des transitions en `steps(2)`.
- **L'affirmation est toujours entre guillemets** (« … », espaces insécables) : c'est ce que dit le post, pas ce que
  dit Seat 12A.
- **Verdicts** (`VerdictBadge`) : pastille teintée + pictogramme pixel + libellé, jamais la couleur seule ; plus
  foncés sur blanc, plus clairs sur la nuit. Teintes hors du couple rouge/bleu politique : Vrai sarcelle, Plutôt vrai
  vert sauge, Trompeur ambre, Faux corail, Non vérifiable gris. **À valider par Jules.**
- Dates et heures à l'heure de Paris, en français (« 1er octobre »).

## Vérifier

```bash
node tools/pages.js                                    # pages principales, données de test, 1280×800
LARGEUR=390 HAUTEUR=844 node tools/pages.js            # téléphone
node tools/pages.js "/fact-checks?q=prix&veracity=mostly_true"
SOMBRE=1 node tools/pages.js                          # ordinateur en mode sombre
REEL=1 node tools/pages.js /fact-checks                # la vraie API
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
