# Seat 12A — site web

Site public de Seat 12A, service francophone de fact-checking centré sur X. **Version bêta** : pour l'instant, la page
d'accueil, un vol en pixel art vu depuis le siège 12A (côté hublot, au-dessus de l'aile), qui se déroule au scroll, du
décollage à l'heure bleue jusqu'à l'atterrissage de nuit à Paris. Viendront les cases (chaque vérification détaillée,
depuis l'API de 12A Tower) et un chatbot pour demander une vérification.

Projet [Astro](https://astro.build), déployé sur Vercel (voir `docs/deploiement.md`).

## Lancer le site

Il faut Node.js 22.23.4 ou plus récent.

```bash
npm install
```

```bash
npm run dev
```

Puis ouvrir http://localhost:4321. Pour vérifier la version de production : `npm run build` puis `npm run preview`.

## Organisation

| Dossier | Contenu |
|---|---|
| `src/pages/` | Les pages (`index.astro`, `404.astro`). |
| `src/scripts/home/` | La scène du vol : plan de vol, shader WebGL2, rendu, défilement, son. |
| `src/styles/`, `src/components/`, `src/layouts/` | Styles, logo, pied de page, coquille HTML commune. |
| `public/` | Fichiers servis tels quels (favicon, robots.txt). |
| `assets/logo/` | Les fichiers sources du logo et de l'icône (SVG). |
| `docs/` | Toute la documentation, en français. **À lire avant de travailler.** |
| `tools/` | Captures d'écran du vol avec Playwright. |

## Reprendre le travail

Lire dans l'ordre : `CLAUDE.md`, `docs/decisions.md` (ce que l'équipe veut et ne veut pas), `docs/accueil.md`
(comment la page fonctionne), puis le dernier résumé dans `docs/sessions/`.
