# La page d'accueil (bêta)

Projet Astro, page `src/pages/index.astro`. La scène du vol est dessinée en WebGL2 par les modules de
`src/scripts/home/`. Code et commentaires en anglais (règle du projet), documentation en français.

## Où est quoi

| Fichier | Rôle |
|---|---|
| `src/pages/index.astro` | Le HTML : sections de texte, altimètre, bouton son. |
| `src/components/Nav.astro` | La barre de navigation de l'accueil. Liens partagés avec les autres pages : `src/lib/links.js`. |
| `src/layouts/Base.astro` | Coquille commune : langue, balises meta, Open Graph, favicon. |
| `src/components/Logo.astro`, `Nav.astro` | Le logo complet (SVG), la barre de navigation (partagée avec les autres pages). |
| `src/pages/404.astro`, `src/scripts/lost/plane.js` | Page introuvable : fond bleu nuit uni, la barre de navigation de l'accueil, un avion de ligne planté dans le sol (rendu 3D transformé en pixel art). |
| `src/styles/site.css`, `chrome.css` | Partie commune : polices (Fontsource), couleurs ; barre de navigation, boutons, liens (`chrome.css`, partagé avec les autres pages). |
| `src/styles/home.css` | Le style propre à l'accueil (le vol, les sections, l'altimètre, le son). |
| `src/scripts/home/main.js` | Point d'entrée : relie tout et fait tourner la boucle d'animation. |
| `src/scripts/home/flightPlan.js` | **Le plan de vol** : images clés, altitude, tangage, horizon, soleil, lune. |
| `src/scripts/home/palettes.js` | Les 8 échelles de 8 tons (OKLCH). |
| `src/scripts/home/shaders/sky.frag.glsl` | Le shader de la scène (passe 1). |
| `src/scripts/home/renderer.js` | WebGL2 : taille des cellules (`cellSize`, partagée), les deux passes. |
| `src/scripts/home/scroll.js` | Piste du vol, placement des textes, Lenis, freinage près des textes. |
| `src/scripts/home/hud.js` | Altimètre, pictogrammes 16×16. |
| `src/scripts/home/intro.js` | L'arrivée : la scène apparaît cellule par cellule, en tramage, depuis le milieu. |
| `src/scripts/home/effects.js` | Étoiles filantes, stroboscope. |
| `src/scripts/home/cabinSound.js` | Son d'ambiance (Web Audio), coupé par défaut, et le « ding » de la ceinture à l'arrivée. |
| `tools/captures.js` | Captures du vol (Playwright) à partir de `dist/client/`. |

## Vue d'ensemble

```
défilement ──► f ∈ [0, 1] : avancement du vol
               ├─► sky(f)                      palette + paramètres du ciel (table KEYS)
               ├─► altFt, tilt, horizon, travel  caméra
               ├─► sunPosition, moonPosition   un soleil, une journée
               └─► uniforms ──► passe 1 (une couleur par cellule) ──► passe 2 (carrés nets) ──► écran
```

Par-dessus le canvas : la barre de navigation, les sections `.sec` (placées par `scroll.js`), l'altimètre, le bouton
son. **Plus de pied de page** (retiré le 25/11/2026) : la page s'arrête à l'arrivée.

## 1. Rendu pixel (`renderer.js`)

- Taille de cellule : `cellCss = max(3, round(max(largeur, hauteur × 1,4) / 480))` px CSS (minimum 2 au lieu de 3
  sous 600 px de large), puis
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
- Phénomènes (0 à 1) : `halo(f)` (parhélies, 0,43–0,6), `contrail(f)` (traînée, 0,63–0,765 : avancement de la
  traversée et visibilité), `network(f)` (vagues sur Paris, à partir de 0,845), `beacon(f)` (angle du faisceau de la
  tour Eiffel, environ un tour sur l'arrivée de nuit). Le lapin et le flash dans le nuage
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
- **Flash dans le nuage** (`uStrobe` dans le bloc du brouillard) : pendant le double éclat, une grande lueur diffuse
  part du stroboscope (`strobeUv`, en haut du winglet), le relief du nuage ressort, quelques faisceaux à peine marqués
  changent d'un éclat à l'autre. Plus visible dans le nuage sombre de la descente que dans le nuage clair de la
  montée, comme en vrai.
- **L'aile dans le brouillard** : le ton de l'aile est mélangé au ton du brouillard (`fogT`), d'autant plus que la
  partie est loin (`1 - exp(-z / 6)` : l'emplanture reste, le bout disparaît) ; le stroboscope éclaire le bout d'aile ;
  le feu rouge est atténué. Hors du nuage, le flash n'éclaire pas l'aile.
- **Traînée** (`uContrail`, ciel de croisière) : l'avion (un point clair) traverse en haut de l'écran sur une
  trajectoire fixe ; derrière lui, la traînée commence fine, s'élargit, ondule et pâlit avec l'âge (`age = cX - p.x`).
  Ses formes (ondulations, grain) dépendent de la position dans le ciel, pas de la distance à l'avion : elles restent
  sur place quand l'avion avance. (Son ombre sur la mer de nuages a été retirée.)
- **Paris** (dans `ground()`) : plus de points lumineux (`cityLight` ne sert plus qu'aux villages). Une valeur `a`
  (quartiers `fbm3`, quelques rues par endroits, avenues de l'Étoile, quais, bord de la ville) devient une petite rampe
  de lumière chaude à 4 intensités, tramée entre voisines. Chaque ligne fait au moins une cellule : plus fine, elle
  devient plus pâle au lieu de disparaître, donc rien ne scintille au défilement. **Le réseau** (`uNet`) : une vague
  `pow(0,5 + 0,5 sin((rad - t·420) / 700), 3)` part du centre et éclaire un peu plus la nappe là où elle passe.
- **Faisceau de la tour Eiffel** (après les bâtiments) : une droite en 3D depuis le sommet (324 m), presque
  horizontale, orientée par `uBeam` (le défilement), projetée avec la caméra ; la distance en mètres le long du
  faisceau est retrouvée par interpolation en perspective (`iz`). Largeur `2,5 m + 0,9 %` de la distance ; plus fin
  qu'une cellule, il pâlit au lieu de s'élargir (`sub`) ; sa lumière s'étale (`(2,5 / largeur)^0,35`) ; diffusion
  Henyey-Greenstein `g = 0,55` (1 vu de côté, jusqu'à 7 quand il vient vers nous) ; atténuation sur 9 km ; brume
  `fbm3` fixée le long du faisceau. Caché par ce qui est plus proche (`occZ` : sol, bâtiments ; l'aile est dessinée
  après). Lueur de la lampe, éclat de la source et de l'aile quand il nous balaie. Le sommet de la tour fait au moins
  une cellule de large.
- **Lapin** (dans `ground()`, avant l'aéroport) : piste parallèle à 1 km (z 978–1022), feux d'approche sur 900 m
  avant le seuil, une barre transversale à 300 m, seuil vert ; un éclair blanc parcourt les 30 postes deux fois par
  seconde vers le seuil. Visible vers f = 0,89–0,93.

### Écran portrait (`uZoom`)

En portrait, `main.js` élargit le champ de vision : `zoom = clamp(hauteur / largeur, 1, 1,8)`, et le shader multiplie
les coordonnées centrées par `uZoom`. Pour que la composition à l'écran ne bouge pas, ce qui est donné en hauteur
d'écran est converti en coordonnées de scène (`toScene(y) = 0,5 + (y − 0,5) × zoom`) : l'horizon, le haut de la mer de
nuages, le soleil (`sunPosition` calcule à l'écran puis convertit), la lune ; dans le shader, la trajectoire de la
traînée (`cX`, `cY`) et la position du stroboscope. Sur écran large, `zoom = 1` : rien ne change.

## 6. Défilement et textes (`scroll.js`)

- `STRETCH = 1.4` : la piste fait `H + 9·H·1,4` px ; `fOf(scroll)` et `sOf(f)` convertissent.
- Les sections `.sec` sont en `position: fixed` ; `placeTexts()` les place à chaque image : centrées quand le scroll
  atteint `sOf(--f)`, décalées de `data-y`. `.left` : alignées à gauche (bureau seulement). `.light` : encre sombre.
  `data-calm="1"` : zone calme derrière.
- **Lenis** (`lerp: .1`) avec `virtualScroll` pour freiner : jusqu'à 28 % près d'un texte.
  Ressort qui ramène à l'arrivée si l'on s'arrête trop tôt. Au doigt : défilement natif, la scène suit avec un léger
  lissage.
- `window.seat12a.goTo(f)` : saute à un point du vol (pour `tools/captures.js`).

## 7. Pictogrammes et volet (`hud.js`, `intro.js`)

- **Même grille que la scène** : `cellSize()` (`renderer.js`) donne la taille d'une cellule ; `main.js` la pose dans
  la variable CSS `--cell`. Un pictogramme s'affiche en 16×16 cellules, le reflet des boutons en 12×16, le volet en
  plein écran. Les pictogrammes sont redessinés avec les tons de la scène.
- Les petites illustrations à côté des textes ont été essayées puis refusées (voir `decisions.md`).
- **Arrivée** (`intro.js`) : un calque des tons les plus sombres couvre l'écran ; chaque cellule se découvre quand son
  seuil Bayer 8×8 passe sous `k × (1 + SPREAD) − distance au centre × SPREAD`, avec un liseré (`RIM`) d'un ton plus
  clair. Son horloge avance image par image (au plus 1/15 s par image, à partir de la troisième) pour qu'une première
  image lente (compilation du shader) ne la fasse pas sauter. Durées : `HOLD`, `OPEN`. `tools/captures.js` attend
  qu'elle soit finie (le canvas `#intro` est retiré).

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
- **Altimètre**, **son** (bruit brun filtré, souffle, vibration à 68 Hz), plus de pied de page (retiré le 25/11/2026, avec « Redécoller »).

## Performances

Le shader est calculé une fois par cellule (~130 000 par image sur un portable). La phase sol est la plus coûteuse.
Pistes si un appareil rame : réduire les octaves de `fbm`, couper le banc de brume, ou une cellule plus grande sur
les petits GPU. La fluidité n'a pas encore été mesurée sur du vrai matériel.
