# La page d'accueil (bêta)

Projet Astro, page `src/pages/index.astro`. La scène du vol est dessinée en WebGL2 par les modules de
`src/scripts/home/`. Code et commentaires en anglais (règle du projet), documentation en français.

## Où est quoi

| Fichier | Rôle |
|---|---|
| `src/pages/index.astro` | Le HTML : barre de navigation, sections de texte, altimètre, bouton son. |
| `src/layouts/Base.astro` | Coquille commune : langue, balises meta, Open Graph, favicon. |
| `src/components/Logo.astro`, `Footer.astro` | Le logo complet (SVG), le pied de page. |
| `src/pages/404.astro` | Page introuvable. |
| `src/styles/home.css` | Tout le style de l'accueil. Les polices sont importées ici (Fontsource). |
| `src/scripts/home/main.js` | Point d'entrée : relie tout et fait tourner la boucle d'animation. |
| `src/scripts/home/flightPlan.js` | **Le plan de vol** : images clés, altitude, tangage, horizon, soleil, lune. |
| `src/scripts/home/palettes.js` | Les 8 échelles de 8 tons (OKLCH). |
| `src/scripts/home/shaders/sky.frag.glsl` | Le shader de la scène (passe 1). |
| `src/scripts/home/renderer.js` | WebGL2 : taille des cellules (`cellSize`, partagée), les deux passes. |
| `src/scripts/home/scroll.js` | Piste du vol, placement des textes, Lenis, freinage, ressort avant le pied de page. |
| `src/scripts/home/hud.js` | Altimètre, pictogrammes 16×16. |
| `src/scripts/home/intro.js` | Le volet de hublot qui remonte à l'arrivée sur la page. |
| `src/scripts/home/effects.js` | Étoiles filantes, stroboscope. |
| `src/scripts/home/cabinSound.js` | Son d'ambiance (Web Audio), coupé par défaut, et le « ding » de la ceinture à l'arrivée. |
| `tools/captures.js` | Captures du vol (Playwright) à partir de `dist/`. |

## Vue d'ensemble

```
défilement ──► f ∈ [0, 1] : avancement du vol
               ├─► sky(f)                      palette + paramètres du ciel (table KEYS)
               ├─► altFt, tilt, horizon, travel  caméra
               ├─► sunPosition, moonPosition   un soleil, une journée
               └─► uniforms ──► passe 1 (une couleur par cellule) ──► passe 2 (carrés nets) ──► écran
```

Par-dessus le canvas : la barre de navigation, les sections `.sec` (placées par `scroll.js`), l'altimètre, le bouton
son, puis le pied de page **après** la piste du vol.

## 1. Rendu pixel (`renderer.js`)

- Taille de cellule : `cellCss = max(3, round(max(largeur, hauteur × 1,4) / 480))` px CSS, puis
  `cell = round(cellCss × devicePixelRatio)` : chaque cellule fait un nombre entier de pixels de l'écran.
- Passe 1 : `sky.frag.glsl` calcule une couleur par cellule dans une texture `gw × gh`.
- Passe 2 : agrandit chaque cellule en carré net (`texelFetch`), ancré en haut à gauche.
- Sans WebGL2 : la classe `no-webgl` est posée sur `<html>` et le fond devient un dégradé tiré de la palette.

## 2. Palettes (`palettes.js`)

- Une **échelle de 8 tons par scène**, en OKLCH : `DAWN`, `SUNRISE`, `CLOUDDAWN`, `CLOUD`, `CRUISE`, `GOLD`, `DUSK`,
  `NIGHT`.
- Dans le shader, tout passe par un **ton** (0 à 1) puis `pal(t, b)` tramé entre deux tons voisins (Bayer 4×4).
  Repères : `G(t)` = sol (bas de l'échelle), `Bt(t)` = bâtiments (milieu), `uWing` = plage de tons de l'aile.
- Règle d'or : mélanger des tons, jamais des couleurs. Le ton > 0,86 est réservé au disque du soleil.
- Seuls hors échelle : lumière chaude `vec3(1., .74, .38)` et feux réels (rouge, bleu, vert, blanc).

## 3. Plan de vol (`flightPlan.js`)

- `KEYS` : images clés `f → { pal, sea, fog, cover, top, bot, lo, hi, sunSize, glow, rays, stars, wing }`,
  interpolées par `sky(f)`.
  - `top`/`bot` : tons du ciel en haut / à l'horizon. `lo`/`hi` : tons des nuages.
  - `sea` : sommet de la mer de nuages. **Ne doit pas bouger pendant qu'on la voit** : on la change quand `fog = 1`.
  - `fog` : 0 → 1, on traverse le nuage. Les changements de scène se font quand `fog = 1`.
  - `sunSize` : rayon du disque (0 = pas de disque). La **position** du soleil ne se règle plus ici (voir §4).
- Courbes : `altFt` (pieds), `tilt` (degrés), `horizon` (hauteur de l'horizon), `groundLights` (lumières du sol),
  `travel` (distance parcourue).
- Phénomènes (0 à 1) : `halo(f)` (parhélies, 0,43–0,6), `contrail(f)` (traînée, 0,55–0,73 : avancement de la
  traversée et visibilité), `network(f)` (réseau de Paris, à partir de 0,845). Le lapin et le flash dans le nuage
  n'ont pas de courbe : ils existent dès que la piste (de nuit, à l'arrivée) ou le brouillard sont là.
- Repères : `GROUND_END = 0.215` (fin de la phase sol), `NIGHT_START = 0.81` (retour au sol, nuit), `CITY_START = 0.5`.
- Étapes : 0 au sol (heure bleue) · ~0,05 rotation · 0,05–0,17 montée · 0,165–0,215 entrée dans le nuage ·
  ~0,34 changement de scène dans le nuage · 0,372–0,44 percée · 0,44–0,77 croisière puis heure dorée ·
  0,772–0,80 descente dans le nuage · 0,81–0,87 sortie sous les nuages, nuit, Paris · 0,955 toucher · 1 arrêt.

## 4. Soleil et lune : la logique

Avant la bêta, la position du soleil était écrite en dur dans les images clés : il était au ras de l'horizon avant le
nuage et réapparaissait haut dans le ciel à la sortie, avec en plus un saut à f = 0,2. La lune de l'arrivée était
plus pleine que celle du matin et éclairée du mauvais côté.

Désormais (`sunPosition`, `moonPosition`) :

- **Le soleil a une hauteur au-dessus de l'horizon** (`sunElevation`), qui change en continu avec f, et l'horizon de
  référence est celui qu'on voit : l'horizon du sol (qui bouge avec le virage) pendant les phases au sol, le sommet
  de la mer de nuages (`SEA_HORIZON = 0.24`) en croisière. Quand l'horizon bouge, le soleil bouge avec lui ; quand
  on sort du nuage, il est là où on l'a laissé : juste au-dessus de l'horizon, à droite.
- **Une journée** : il se lève pendant la montée (il apparaît parce qu'on monte), il est encore bas à la percée,
  monte pendant la croisière, redescend à l'heure dorée et se couche dans la mer de nuages pendant qu'on y descend.
  Puis la nuit.
- **La lune** : un fin croissant avant l'aube, éclairé du côté du soleil qui va se lever (à droite, sous l'horizon) ;
  il pâlit quand le ciel s'éclaire. **Pas de lune la nuit** : un croissant descendant est proche du soleil et se
  couche avant lui ; c'est aussi pour ça que la Voie lactée est si visible à l'arrivée.
- **Sur écran vertical** (`sunElevationPortrait`), les textes prennent toute la largeur : le soleil reste au-dessus
  d'eux pendant qu'on lit, et ne monte ou ne se couche qu'entre deux textes (0,478–0,512 et 0,748–0,775).

Pour régler : modifier `sunX`, `sunElevation` ou `sunElevationPortrait`, jamais une position à l'écran.

## 5. Le shader (`sky.frag.glsl`), dans l'ordre de `main()`

1. **Repère** : rotation par `uTilt` ; `sy` = hauteur au-dessus de l'horizon (`uHorizon`).
2. **Zone calme** (`uCalm`) : ellipse douce derrière le texte lu, très légère. À garder discrète.
3. **Ciel** : dégradé, halo et rayons du soleil, disque (`T = 1.03`), plafonné à 0,86 ailleurs.
4. **Nuit** : Voie lactée, étoiles, étoile filante, lune (sphère, phase via `uMoonL`, mers).
5. **Phase sol** (`uGround`) : couche de nuages au-dessus (1 800 m), banc de brume à l'horizon, sol `ground()`
   (aéroport, parcellaire, forêts, rivière, autoroute, villages ; la nuit, Paris avec des lumières ancrées au sol,
   `cityLight()`), objets debout `building()` (tour de contrôle, aérogare, avion, mâts ; monuments de Paris), phare
   de la tour Eiffel.
6. **Mer de nuages** (`uSea`) et **brouillard** (`uFog`, qui arrive par le côté du nuage selon `uFogDir`). Tous liés
   au défilement (`uFlightX`) et au temps.
7. **Aile gauche en 3D** projetée avec la même caméra, reflet du soleil (`uGlint`), feu rouge, stroboscope.

### Les phénomènes qui illustrent les textes (dans `sky.frag.glsl`)

Une ambiance, pas des formes précises : le pixel art ne permet pas le détail.

- **Halo et parhélies** (`uHalo`, dans le ciel) : anneau à 0,485 hauteur d'écran du soleil (tan 22° × F), ciel un peu
  plus sombre juste à l'intérieur, deux taches claires à hauteur du soleil avec une traîne vers l'extérieur, une ligne
  très pâle entre elles ; le tout tacheté par un bruit (le voile de cristaux). La mer de nuages passe devant.
- **Flash dans le nuage** (`uStrobe` dans le bloc du brouillard) : pendant le double éclat, le brouillard tire vers le
  ton 0,97 autour du bout d'aile (et un peu partout). Plus visible dans le nuage sombre de la descente que dans le
  nuage clair de la montée, comme en vrai.
- **Traînée** (`uContrail`, ciel de croisière) : l'avion (un point clair) traverse en haut de l'écran ; derrière lui,
  la traînée commence fine, s'élargit, ondule et pâlit avec l'âge. **Son ombre** : une bande sombre aplatie sur la mer
  de nuages, décalée.
- **Réseau de Paris** (`uNet`, dans `ground()`) : environ une rue sur deux porte des pointillés lumineux et des éclats
  qui s'éloignent du centre ; il s'étend avec `uNet`. Seulement de près (`near`), sinon les rues remplissent tout.
- **Lapin** (dans `ground()`, avant l'aéroport) : piste parallèle à 1 km (z 978–1022), feux d'approche sur 900 m
  avant le seuil, une barre transversale à 300 m, seuil vert ; un éclair blanc parcourt les 30 postes deux fois par
  seconde vers le seuil. Visible vers f = 0,89–0,93.

## 6. Défilement et textes (`scroll.js`)

- `STRETCH = 1.4` : la piste fait `H + 9·H·1,4` px ; `fOf(scroll)` et `sOf(f)` convertissent.
- Les sections `.sec` sont en `position: fixed` ; `placeTexts()` les place à chaque image : centrées quand le scroll
  atteint `sOf(--f)`, décalées de `data-y`. `.left` : alignées à gauche (bureau seulement). `.light` : encre sombre.
  `data-calm="1"` : zone calme derrière.
- **Lenis** (`lerp: .1`) avec `virtualScroll` pour freiner : jusqu'à 28 % près d'un texte, 16 % avant le pied de page.
  Ressort qui ramène à l'arrivée si l'on s'arrête trop tôt. Au doigt : défilement natif, la scène suit avec un léger
  lissage.
- `window.seat12a.goTo(f)` : saute à un point du vol (pour `tools/captures.js`).

## 7. Pictogrammes et volet (`hud.js`, `intro.js`)

- **Même grille que la scène** : `cellSize()` (`renderer.js`) donne la taille d'une cellule ; `main.js` la pose dans
  la variable CSS `--cell`. Un pictogramme s'affiche en 16×16 cellules, le reflet des boutons en 12×16, le volet en
  plein écran. Les pictogrammes sont redessinés avec les tons de la scène.
- Les petites illustrations à côté des textes ont été essayées puis refusées (voir `decisions.md`).
- **Volet** (`intro.js`) : lattes (rainure, reflet, face), barre du bas plus épaisse, poignée. Il se décroche (4
  cellules), marque une pause, puis remonte. Son horloge avance image par image (au plus 1/15 s par image, à partir de
  la troisième) pour qu'une première image lente (compilation du shader) ne le fasse pas sauter. Durées : `HOLD`,
  `UNLATCH`, `PAUSE`, `RISE`. `tools/captures.js` attend qu'il ait disparu.

## 8. Avant le script, sans script

- Un petit script dans `<head>` (`index.astro`) pose `html.js`. Tant que `main.js` n'a pas dessiné sa première image
  (`html.flying`), on ne voit que le fond, de la couleur du volet fermé : les sections ne s'empilent plus au centre.
- Si `main.js` n'a pas démarré au bout de 6 s (bloqué, erreur), ou sans JavaScript du tout, `html.static` affiche les
  textes comme une page simple, les uns sous les autres (fond uni, sans pictogrammes ni altimètre).
- La boucle d'animation se relance en premier à chaque image : une erreur dans une image ne fige plus les textes. Si le
  dessin WebGL échoue ou si le contexte est perdu, on passe au dégradé, et on reconstruit le rendu quand le contexte
  revient.

## 9. Le reste

- **Liens `data-soon`** : pages pas encore créées, le clic ne fait rien.
- **Boutons** : au survol, fond bleu ciel pâle et reflet en pixels (`.btn::after`, un petit SVG en escalier de 12×16
  cellules) qui traverse le bouton en 9 crans, en boucle toutes les 1,5 s. Liens : pointillés qui défilent comme un
  marquage de piste.
- **Altimètre**, **son** (bruit brun filtré, souffle, vibration à 68 Hz), **pied de page** opaque après `.foot-gap`
  (22 vh), avec « Redécoller » : comme dans le prototype.

## Performances

Le shader est calculé une fois par cellule (~130 000 par image sur un portable). La phase sol est la plus coûteuse.
Pistes si un appareil rame : réduire les octaves de `fbm`, couper le banc de brume, ou une cellule plus grande sur
les petits GPU. La fluidité n'a pas encore été mesurée sur du vrai matériel.
