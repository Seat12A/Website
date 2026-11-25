# CLAUDE.md — Seat 12A, site web

## Contexte

Seat 12A est un service francophone de fact-checking et de modération centré sur X. Identité visuelle : l'aviation
(Tower, gate, hangar, radar, intercom). Trois clients passent par l'API de **12A Tower** (backend, dépôt `seat12a/tower`) :
ce site web public, une extension Chromium et un bot Discord interne. Le site ne touche jamais la base directement.
Le site aura trois parties : la page d'accueil (en bêta), les cases (chaque fact-check détaillé) et un chatbot pour
demander une vérification. On ne vend rien, et tout le code est public. Seat 12A n'a pas encore de statut juridique :
ne jamais écrire « association » sur le site.

Pile : **Astro**, déployé sur **Vercel** (adaptateur `@astrojs/vercel`) : l'accueil est statique, les pages des
fact-checks sont rendues côté serveur depuis l'API de Tower (`docs/fact-checks.md`, `docs/api-tower.md`). Ces pages-là
utilisent **shadcn/ui** (Tailwind 4, React rendu sur le serveur), en clair par défaut. Pas de CDN externe au
chargement : polices (Fontsource) et Lenis viennent de npm. Voir `docs/deploiement.md`.

Le développeur principal s'appelle Jules. Il parle français ; répondre en français, honnêtement, et dire quand on ne
sait pas.

## Avant de travailler

1. Lire `docs/decisions.md` : les règles de design et tout ce que Jules a refusé. C'est le document le plus important.
2. Lire `docs/accueil.md` : l'architecture de la page d'accueil et où régler chaque chose.
3. Lire le dernier résumé dans `docs/sessions/`.
4. Pour l'inspiration, `docs/inspiration-aria.md` (le site d'Aria, analysé en détail).

## Règles

- Documentation en français dans `docs/`. Code et commentaires en anglais (règle du projet Tower). Les textes affichés
  aux visiteurs sont en français.
- Ne jamais copier le code, les textes ou les assets d'Aria (joinariapp.com) : on s'inspire des techniques, on écrit
  les nôtres. Le dépôt est public.
- Pour les visiteurs, jamais le mot « case » : « fact-check » ou « vérification ».
- Jamais de texte tout en majuscules. Jamais de titre en deux couleurs. Pas d'effets « IA » (voir `docs/decisions.md`).
- Toute illustration est en pixel art, sur la grille de cellules, dans l'échelle de tons de la scène.
- Ne pas inventer de faux fact-checks présentés comme réels : les contenus réels viendront de l'API de Tower.
- Les textes doivent apprendre quelque chose au visiteur, et ce qu'ils disent du fonctionnement doit être vrai :
  voir `docs/textes.md`.
- Soleil et lune : jamais de position écrite à l'écran, une hauteur au-dessus de l'horizon (`flightPlan.js`).
- Vérifier chaque changement visuel avec `npm run build` puis `node tools/captures.js <points du vol>` (accueil) ou
  `node tools/pages.js <adresses>` (fact-checks, en clair et avec `SOMBRE=1`), et regarder les images.
- Les pages autres que l'accueil : shadcn/ui, minimalistes, sans style avion recopié (`docs/decisions.md`).
- Chaque session se termine par un résumé dans `docs/sessions/AAAA-MM-JJ-sujet.md`.

## Vérifier

```bash
npm install && npm run build            # d'abord : les captures utilisent dist/
node tools/captures.js                  # vol complet en 11 images, dans tools/captures/
node tools/captures.js 0.16 0.18 0.2    # zoom sur un passage
LARGEUR=390 HAUTEUR=844 node tools/captures.js 0 0.55 1   # téléphone
node tools/pages.js                     # pages des fact-checks (faux Tower local ; REEL=1 pour la vraie API)
```

Playwright et Chromium sont nécessaires (`require('playwright')`). Le rendu passe par SwiftShader : lent mais fidèle.
Les captures ne montrent ni la fluidité ni le son : demander à Jules de vérifier à l'œil et à l'oreille.
