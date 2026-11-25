# Session du 25/11/2026 — les pages des fact-checks

## Demandes de Jules

1. Ajouter les cases au site, avec la doc de l'API de Tower (`api.seat12a.org`).
2. En cours de route : un style **minimaliste mais cool, shadcn/ui obligatoire**, de petits rappels au pixel, **clair
   par défaut et sombre si l'ordinateur l'est**, **pas de style avion recopié**, la même typo que l'accueil.

## Ce qui a été fait

- **Rendu côté serveur** : adaptateur `@astrojs/vercel` ; l'accueil et la 404 restent statiques. Client de l'API côté
  serveur (`src/lib/tower.js`), libellés français (`src/lib/labels.js`), cache CDN de 5 minutes.
- **Pages** : `/fact-checks` (recherche, filtres verdict / type / pays / ordre, comptes, tableau, pages),
  `/fact-checks/{id}` (affirmation, verdict, note, ce qui manque, « En savoir plus », sources, post, fiche, historique),
  `/post/x/{id}` (« Ce post a-t-il été vérifié ? », atteint en collant un lien X dans la recherche). Vraies 404, 503
  si Tower ne répond pas. Le post X ne se charge qu'au clic (script et cookies de X).
- **Design** : d'abord une version sombre façon « tableau des arrivées », puis, à la demande de Jules, refaite en
  shadcn/ui (Tailwind 4, React rendu sur le serveur, aucun React dans le navigateur), claire par défaut, sombre selon
  l'ordinateur, Geist et Geist Mono, bleu nuit `#0B1030` pour la continuité, pictogrammes pixel, points carrés, ligne
  tramée sous l'en-tête.
- Liens « Fact-checks » / « Voir les fact-checks » de l'accueil et du pied de page branchés. Liens partagés dans
  `src/lib/links.js` ; partie commune du CSS de l'accueil sortie dans `site.css` (rendu de l'accueil inchangé).
- **Outils** : `tools/pages.js` (captures des pages, `SOMBRE=1`, `REEL=1`) et `tools/tower-mock.js` (faux Tower local,
  données de test jamais servies aux visiteurs). `tools/captures.js` lit maintenant `dist/client/`.
- Docs : `fact-checks.md`, `api-tower.md` (nouveaux), `deploiement.md`, `decisions.md`, `accueil.md`, `CLAUDE.md`.

## Constaté sur l'API en production

`/v1/cases/search`, `/v1/cases/stats` et `/v1/cases/{id}/details` **n'existent pas encore** en production (testé le
25/11/2026). Le site se replie sur l'ancienne liste `/v1/cases` : pas de filtres ni de recherche par mots, page de
fact-check réduite au titre, au lien de la publication et au post. Un seul case publié : « 1+1=4 » (test). Il faut
déployer la nouvelle version de Tower ; ensuite, retirer le repli (`src/lib/tower.js`).

## Vérifié

- `npm run build` sans erreur. Captures en clair et en sombre (1280×800) et au téléphone (390×844) : liste, filtres,
  recherche vide, fact-check complet, post vérifié et non vérifié, 404, contre le faux Tower ; liste et fact-check
  contre la vraie API (repli). Accueil recapturé : inchangé, aucune erreur dans la console.
- Non vérifié : l'embed de X (pas de réseau vers X dans les captures), le déploiement réel sur Vercel (adaptateur).

## À faire ensuite

- Jules : valider les couleurs et pictogrammes des verdicts, regarder les pages en clair et en sombre.
- Déployer Tower avec `search`, `stats`, `details`, puis retirer le repli.
- Badges (légende, vérifier un compte, demander, signaler), derniers fact-checks sur l'accueil, page de statistiques.
- Décider du formulaire « Un doute ? » de l'accueil (voir `fact-checks.md`).
