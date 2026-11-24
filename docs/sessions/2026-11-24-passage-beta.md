# Session du 24/11/2026 — passage en bêta

## Demandes de Jules

1. « Ce n'est plus un proto, on passe en bêta », hébergée sur Vercel : tout reprendre pour que ça marche.
2. Changer le texte sur l'auteur (« on s'en fiche ») et proposer des textes utiles, pas futiles.
3. Donner une logique au soleil et à la lune (« on passe le nuage et le soleil change de place »).

## Ce qui a été fait

- **Projet Astro** à la racine (`src/`, `public/`, `astro.config.mjs`), statique, prêt pour Vercel (`vercel.json` :
  en-têtes de sécurité, cache des fichiers versionnés, URL propres). Page 404. Balises meta et Open Graph. Le dossier
  `prototype/` est supprimé (il reste dans l'historique git).
- Le fichier unique du prototype est découpé en modules (`src/scripts/home/`) ; **code et commentaires en anglais**.
  Code mort retiré : orage, éclairs, sommets, plafond `uCeil`, reflet de piste, pointeur, `ridge()`.
- Plus aucun CDN : Geist et Geist Mono par Fontsource (hébergées avec le site, rien chez Google), Lenis 1.1.13 par npm
  (même version qu'avant, pour garder le même défilement).
- **Soleil et lune** : le soleil a une hauteur au-dessus de l'horizon visible (sol, puis mer de nuages), continue sur
  tout le vol : lever pendant la montée, bas à la percée, haut en croisière, coucher dans la mer de nuages. Fini le
  saut à f = 0,2 et le soleil qui réapparaît haut à la sortie du nuage. Lune : croissant à l'aube seulement, pas de
  lune la nuit (logique pour un croissant descendant, et la Voie lactée en profite). Sur téléphone, le soleil ne
  traverse le milieu de l'écran qu'entre deux textes.
- **Textes** : section dans le nuage remplacée (« D'abord, on isole ce qui est affirmé »), hero sans la mention de
  l'auteur, section « Puis on cherche » plus concrète, arrivée remplacée par le signalement d'erreurs. Propositions et
  points à valider : `docs/textes.md`.
- `tools/captures.js` sert désormais `dist/` (faire `npm run build` avant).
- Docs : `accueil.md` (ex-`prototype-accueil.md`), `textes.md`, `deploiement.md`, `decisions.md` et `CLAUDE.md` mis à
  jour.

## Vérifié

- `npm run build` sans erreur ; captures bureau (1280×800) et téléphone (390×844) de tout le vol, aucune erreur dans
  la console ; Lenis actif dans la version compilée ; page 404 servie avec le bon statut.
- Non vérifié : le déploiement réel sur Vercel (pas d'accès depuis la session), la fluidité sur du vrai matériel, le
  son.

## À faire ensuite

- Jules : brancher le dépôt sur Vercel (`docs/deploiement.md`), choisir les textes, valider avec l'équipe de Tower
  ce que les textes affirment (relecture humaine, corrections, signalement d'erreurs).
- Avant d'ouvrir la bêta au public : mentions légales, confidentialité, liens `data-soon` (créer les pages ou les
  masquer), formulaire « Vérifier », image Open Graph.
