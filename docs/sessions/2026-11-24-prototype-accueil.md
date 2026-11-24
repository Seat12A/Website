# Session du 24/11/2026 — prototype de la page d'accueil

## Objectif

Concevoir la page vitrine de Seat 12A en s'inspirant du site d'Aria (joinariapp.com), puis la prototyper.

## Ce qui a été fait

1. Analyse du site d'Aria (animations, palette, défilement) : voir `docs/inspiration-aria.md`.
2. Plan détaillé de la page : `docs/plan-accueil-initial.md` (sections, textes, détails). Il a servi de point de
   départ ; le prototype s'en est écarté sur plusieurs points (pas de hublot encadré, nuit à l'arrivée, etc.).
3. Prototype `prototype/accueil/index.html`, en une trentaine d'itérations avec Jules :
   - vol complet au scroll, heure bleue → croisière → nuit sur Paris ;
   - rendu pixel en deux passes, échelles de 8 tons OKLCH par scène ;
   - sol en perspective, aéroport, aile en 3D, nuages en couche et en brouillard, nuit étoilée, Paris ;
   - barre de navigation avec le logo, sections de contenu réel, pictogrammes, pied de page, son d'ambiance ;
   - défilement Lenis freiné près des textes, ressort avant le pied de page ;
   - responsive (vérifié au format iPhone 13).
4. Logo et icône ajoutés dans `assets/logo/`.
5. Script de vérification `tools/captures.js`.

## Décisions importantes

Toutes dans `docs/decisions.md`, en particulier la liste de ce qui fait « IA » et a été retiré.

## Où on en est

Le prototype est validé dans ses grandes lignes par Jules, avec des retours encore en cours sur le défilement et les
nuages. Il est publié en artifact privé (lien connu de Jules) ; **la source de référence est désormais ce dépôt**.

## Prochaines étapes possibles

- Faire vérifier la fluidité sur de vrais appareils (portable, téléphone) et ajuster.
- Raccourcir les longs passages sans nouveauté (intérieur du nuage, croisière, noir de la descente) si Jules le souhaite.
- Section « la traversée » animée (un post dont l'auteur se dissout, l'affirmation, le verdict) et tableau des arrivées
  branché sur l'API de Tower (voir le plan initial).
- Nettoyer les restes de code (voir `docs/prototype-accueil.md`) et traduire les commentaires en anglais.
- Choisir la pile du vrai site (Astro envisagé) et y porter le prototype.
