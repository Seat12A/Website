# Seat 12A — site web

Site public de Seat 12A, service francophone de fact-checking centré sur X. Ce dépôt contient pour l'instant le
**prototype de la page d'accueil** : un vol en pixel art, vu depuis le siège 12A (côté hublot, au-dessus de l'aile),
qui se déroule au scroll, du décollage à l'heure bleue jusqu'à l'atterrissage de nuit à Paris.

## Voir le prototype

Le prototype tient dans un seul fichier, sans étape de build :

```bash
cd prototype/accueil && python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000. Ouvrir le fichier directement fonctionne aussi, mais le défilement fluide (Lenis,
chargé depuis un CDN) peut alors manquer.

## Organisation

| Dossier | Contenu |
|---|---|
| `prototype/accueil/` | Le prototype de la page d'accueil (HTML, CSS et un shader WebGL2 dans un seul fichier). |
| `assets/logo/` | Le logo complet et l'icône (SVG). |
| `docs/` | Toute la documentation, en français. **À lire avant de travailler.** |
| `tools/` | Scripts de vérification (captures d'écran du vol avec Playwright). |

## Reprendre le travail

Lire dans l'ordre : `CLAUDE.md`, `docs/decisions.md` (ce que l'équipe veut et ne veut pas), `docs/prototype-accueil.md`
(comment le prototype fonctionne), puis le dernier résumé dans `docs/sessions/`.
