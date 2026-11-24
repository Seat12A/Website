# Le prototype de la page d'accueil

Fichier unique : `prototype/accueil/index.html` (~1 150 lignes : HTML, CSS, JavaScript et un shader GLSL dans une
chaîne). Aucune dépendance à installer ; Geist vient de Google Fonts et Lenis d'un CDN.

> Ce prototype sert à valider le rendu et l'expérience. Le vrai site (Astro est envisagé, voir
> `plan-accueil-initial.md`) reprendra ces techniques, avec le code en anglais et les contenus venant de l'API de Tower.

## Vue d'ensemble

```
défilement (scroll) ──► f ∈ [0, 1] : avancement du vol
                        │
                        ├─► sky(f)       palette de la scène + paramètres du ciel (table K)
                        ├─► altFt(f)     altitude, d'où la hauteur de la caméra
                        ├─► tilt(f), horizon(f)   tangage et virage (inclinaison et hauteur de l'horizon)
                        ├─► travel(f)    distance parcourue au sol (le décor défile)
                        └─► uniforms ──► shader (passe 1, une couleur par cellule) ──► passe 2 (carrés nets) ──► écran
```

Par-dessus le canvas : la barre de navigation, les sections de texte (`.sec`, positionnées par le script), l'altimètre,
le bouton son, puis le pied de page **après** la piste du vol.

## 1. Rendu pixel (`layout()`)

- Taille de cellule comme Aria : `cellCss = max(3, round(max(largeur, hauteur × 1,4) / 480))` px CSS, puis
  `cellDev = round(cellCss × devicePixelRatio)` : chaque cellule fait un nombre entier de pixels de l'écran.
- Passe 1 : le shader `FS` calcule une couleur par cellule dans une texture `gw × gh`.
- Passe 2 : le shader `BLIT` agrandit chaque cellule en carré net (`texelFetch`), ancré en haut à gauche.

## 2. Palettes (`PAL`, `oklch()`)

- Une **échelle de 8 tons par scène**, construite en OKLCH : `ladder(luminosités, chromas, teintes)`. Scènes :
  `DAWN`, `SUNRISE`, `CLOUDDAWN`, `CLOUD`, `CRUISE`, `GOLD`, `DUSK`, `NIGHT`.
- Dans le shader, tout passe par un **ton** (0 à 1) puis `pal(t, b)` qui tramé entre deux tons voisins (Bayer 4×4).
  Repères : `G(t)` = sol (bas de l'échelle), `Bt(t)` = bâtiments (milieu), `uWing` = plage de tons de l'aile.
- Règle d'or : mélanger des tons, jamais des couleurs (sinon damier). Le ton > 0,86 est réservé au disque du soleil.
- Seuls hors échelle : lumière chaude `vec3(1., .74, .38)` et feux réels (rouge, bleu, vert).

## 3. Plan de vol (table `K` et courbes)

- `K` : images clés `f → { pal, ceil, sea, fog, cover, top, bot, lo, hi, sun, glow, rays, stars, wing }`, interpolées
  en douceur par `sky(f)`.
  - `top`/`bot` : tons du ciel en haut / à l'horizon. `lo`/`hi` : tons des nuages.
  - `sea` : sommet de la mer de nuages (croisière) ; `ceil` : bas d'un plafond nuageux (nuit d'arrivée, désactivé
    actuellement à 1,4). **Ils ne doivent pas bouger pendant qu'on les voit** ; on les change quand `fog = 1`.
  - `fog` : 0 → 1, on traverse le nuage. Les changements de scène se font quand `fog = 1`.
- Courbes (`curve([[f, valeur], …])`) : `altFt` (pieds), `tilt` (degrés : cabrer fait pencher l'horizon vu du hublot
  gauche), `horizon` (le virage à gauche fait remonter l'horizon), `lightsF` (lumières du sol), `sunEl` (le soleil
  sort de l'horizon pendant la montée).
- Étapes : 0 au sol (heure bleue) · ~0,05 rotation · 0,05–0,17 montée · 0,165–0,215 entrée dans le nuage ·
  ~0,34 changement de scène dans le nuage · 0,372–0,44 percée · 0,44–0,77 croisière puis heure dorée ·
  0,772–0,80 descente dans le nuage · 0,81–0,87 sortie sous les nuages, nuit, Paris · 0,955 toucher · 1 arrêt.

## 4. Le shader (`FS`), dans l'ordre de `main()`

1. **Repère** : rotation par `uTilt` ; `sy` = hauteur au-dessus de l'horizon (`uHorizon`).
2. **Zone calme** (`uCalm`) : ellipse douce derrière le texte lu, très légère (ciel un peu plus sombre, moins de
   nuages). À garder discrète (le « projecteur » visible a été refusé).
3. **Ciel** : dégradé, halo et rayons du soleil, disque (`T = 1.03`), plafonné à 0,86 ailleurs.
4. **Nuit** : Voie lactée (`uMilky`), étoiles (une cellule, croix pour les plus brillantes), étoile filante (`uMet`),
   lune (sphère, phase via `uMoonL`, mers).
5. **Phase sol** (`uGround`) :
   - couche de nuages au-dessus (altitude `Hc = 1800 m`) : perspective en haut du ciel, masses à peine aplaties près
     de l'horizon, éclairées vers le soleil, s'estompe quand on y entre ;
   - banc de brume au ras de l'horizon (évite une bande vide) ;
   - **sol** `ground()` : sol en perspective (`z = h·F / −sy`), aéroport (piste, feux de bord, taxiway et ses feux
     bleus et verts), parcellaire simplifié, forêts, rivière, autoroute avec phares, villages ; la nuit, **Paris**
     (Seine et ponts, quais, rues, avenues de l'Étoile) avec des lumières **ancrées au sol** (`cityLight()`, grille
     multi-échelle sans scintillement) ;
   - **bâtiments** `building()` : tour de contrôle (phare vert/blanc), aérogare, avion au parking, mâts d'éclairage ; la
     nuit : Notre-Dame, Montparnasse, Arc de Triomphe, Sacré-Cœur, La Défense, tour Eiffel dorée ;
   - **phare de la tour Eiffel** : un faisceau qui tourne ; quand il pointe vers nous (`beamHit`), éclat et aile
     éclairée.
6. **Nuages et brouillard** : mer de nuages (`uSea`) avec tours de cumulus ; brouillard (`uFog`) en bancs qui défilent,
   arrivant par le côté du nuage (`uFogDir` : +1 par le haut en montant, −1 par le bas en descendant). Tous liés au
   défilement (`uFlightX`) et au temps.
7. **Aile gauche en 3D** projetée avec la même caméra (flèche ~25°, dièdre ~5°, corde 6 → 1,5 m, 17 m) : becs,
   spoilers, volets, aileron, reflet du soleil (`uGlint`), winglet ; feu de navigation rouge fixe, stroboscope blanc à
   double éclat (`strobe()`).

Pour régler une scène : modifier `K` (couleurs, nuages), les courbes, ou la section concernée du shader. Vérifier
avec `node tools/captures.js <f>`.

## 5. Défilement et textes

- `STRETCH = 1.4` : la piste du vol fait `H + 9·H·1,4` px ; `fOf(scroll)` et `sOf(f)` convertissent.
- Les sections `.sec` sont en `position: fixed` ; `placeTexts()` les place chaque image : centrées quand le scroll
  atteint `sOf(--f)`, décalées de `data-y` (fraction d'écran). Classe `.left` : alignées à gauche (bureau seulement).
- **Lenis** (`lerp: .1`) avec l'option `virtualScroll`, qui permet de multiplier chaque mouvement par `brake()` :
  ralenti jusqu'à 28 % près d'un texte, 16 % dans la zone avant le pied de page. `smoothScroll()` ramène à l'arrivée si
  l'on s'arrête avant d'avoir franchi le seuil (ressort). Au doigt : défilement natif (le ressort marche aussi).
- `window.seat12a.goTo(f)` : point d'accès pour les scripts de vérification.

## 6. Le reste

- **Altimètre** : chiffres qui roulent, petit avion en pixels qui suit l'assiette (cabre en montée).
- **Pictogrammes** des règles : cartes 16×16 dans `PICTOS`, redessinées avec les tons de la scène (`drawPictos`).
- **Son** (`Cabin`) : Web Audio, ambiance seule (bruit brun filtré, souffle, vibration à 68 Hz), coupé par défaut.
- **Boutons** : balayage bleu ciel par paliers au survol, bord en damier ; liens soulignés en tirets qui défilent.
- **Pied de page** : opaque, bord supérieur tramé, après `.foot-gap` (22 vh).

## Restes à nettoyer

- `lightning()`, `uPeaks`, `uStorm`, `uBolt`, `uRays` sont encore déclarés ou envoyés alors que les sommets et l'orage
  ont été retirés : sans effet, à supprimer.
- `uCeil` n'est plus utilisé dans la table (toujours 1,4).
- Commentaires en français : à traduire en anglais pour le vrai site (règle du projet).

## Performances

Le shader est calculé une fois par cellule (~130 000 par image sur un portable). La phase sol (sol + nuages + bâtiments)
est la plus coûteuse. Pistes si un appareil rame : réduire les octaves de `fbm`, couper le banc de brume, ou passer à
une cellule plus grande sur les petits GPU. La fluidité n'a pas pu être mesurée sur du vrai matériel pendant la session.
