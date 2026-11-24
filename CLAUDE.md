# CLAUDE.md — Seat 12A, site web

## Contexte

Seat 12A est un service francophone de fact-checking et de modération centré sur X. Identité visuelle : l'aviation
(Tower, gate, hangar, radar, intercom). Trois clients passent par l'API de **12A Tower** (backend, dépôt `seat12a/tower`) :
ce site web public, une extension Chromium et un bot Discord interne. Le site ne touche jamais la base directement.
Le site aura trois parties : la page d'accueil (prototype ici), les cases (chaque fact-check détaillé) et un chatbot
pour demander une vérification. Seat 12A est une association à but non lucratif : on ne vend rien.

Le développeur principal s'appelle Jules. Il parle français ; répondre en français, honnêtement, et dire quand on ne
sait pas.

## Avant de travailler

1. Lire `docs/decisions.md` : les règles de design et tout ce que Jules a refusé. C'est le document le plus important.
2. Lire `docs/prototype-accueil.md` : l'architecture du prototype et où régler chaque chose.
3. Lire le dernier résumé dans `docs/sessions/`.
4. Pour l'inspiration, `docs/inspiration-aria.md` (le site d'Aria, analysé en détail).

## Règles

- Documentation en français dans `docs/`. Le code du prototype est commenté en français ; pour le vrai site, le code
  sera en anglais (règle du projet Tower), la documentation reste en français.
- Ne jamais copier le code, les textes ou les assets d'Aria (joinariapp.com) : on s'inspire des techniques, on écrit
  les nôtres. Le dépôt est public.
- Jamais de texte tout en majuscules. Jamais de titre en deux couleurs. Pas d'effets « IA » (voir `docs/decisions.md`).
- Toute illustration est en pixel art, sur la grille de cellules, dans l'échelle de tons de la scène.
- Ne pas inventer de faux fact-checks présentés comme réels : les contenus réels viendront de l'API de Tower.
- Vérifier chaque changement visuel avec `node tools/captures.js <points du vol>` et regarder les images.
- Chaque session se termine par un résumé dans `docs/sessions/AAAA-MM-JJ-sujet.md`.

## Vérifier

```bash
node tools/captures.js                  # vol complet en 11 images, dans tools/captures/
node tools/captures.js 0.16 0.18 0.2    # zoom sur un passage
LARGEUR=390 HAUTEUR=844 node tools/captures.js 0 0.55 1   # téléphone
```

Playwright et Chromium sont nécessaires (`require('playwright')`). Le rendu passe par SwiftShader : lent mais fidèle.
Les captures ne montrent ni la fluidité ni le son : demander à Jules de vérifier à l'œil et à l'oreille.
