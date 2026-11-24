# Décisions de design et retours de Jules

Ce document rassemble ce qui a été décidé pour la page d'accueil, et surtout **ce que Jules a refusé**, pour ne pas
refaire les mêmes erreurs. Il est issu de la session du 24/11/2026 (une trentaine d'itérations sur le prototype), complété au passage en bêta.

## Le concept

- **Un vol vu du siège 12A** : hublot gauche, au-dessus de l'aile. Le scroll fait **gagner de l'altitude** (et non
  passer le temps comme chez Aria). Métaphore : prendre de la hauteur sur ce qui circule pour y voir clair.
- **Déroulé** : heure bleue au sol (aéroport éclairé, étoiles, croissant de lune) → décollage → montée en virage à
  gauche, le sol s'éloigne → le soleil se lève *parce qu'on monte* (phénomène réel) → entrée progressive dans les
  nuages → croisière au-dessus d'une mer de nuages → heure dorée → descente dans les nuages → nuit sur Paris
  (tour Eiffel et son phare, Seine, monuments) → atterrissage face à la tour de contrôle.
- Le titre du hero : « Prenez de la hauteur sur ce qui circule. »

## Règles visuelles (validées)

- **Pixel art partout** pour les illustrations : rendu dans une grille de cellules, ~480 cellules sur la largeur
  (comme Aria), chaque cellule = un nombre entier de pixels de l'écran (carrés nets). Jules a testé plus fin (640) :
  « trop précis » ; il est revenu à 480.
- **Une seule échelle de 8 tons par scène** (comme Aria), construite en OKLCH : sol, bâtiments, aile, nuages, ciel et
  pictogrammes y puisent tous. On mélange toujours des **tons** avant le tramage, jamais des couleurs, sinon on obtient
  un damier entre deux couleurs éloignées (« grillage de petits carrés » : refusé).
- **Un seul accent hors échelle** : la lumière chaude des fenêtres et des villes. Exceptions réelles : feu de
  navigation rouge, feux bleus et verts du taxiway, phare vert et blanc de l'aéroport.
- **Le soleil** : disque net, réservé au ton le plus clair ; halo et rayons (Jules veut garder les rayons : sans eux,
  le halo sature en un aplat). Les nuages passent **devant** le soleil.
- **Soleil et lune logiques** (demande de Jules, 24/11/2026 : « on passe le nuage et le soleil change de place ») :
  le soleil n'est jamais placé directement à l'écran ; il a une hauteur au-dessus de l'horizon visible qui change en
  continu. Une seule journée : lever pendant la montée, encore bas à la percée, haut en croisière, coucher dans la mer
  de nuages à la descente, puis la nuit. Lune : croissant avant l'aube du côté du soleil, **pas de lune la nuit**
  (un croissant descendant s'est couché avant le soleil). Détails : `accueil.md` §4.
- **Typographie** : Geist (texte) et Geist Mono (altimètre). **Police normale** pour les titres (le titre dessiné en
  pixels a été refusé). **Titres d'une seule couleur. Jamais de texte tout en majuscules.**
- **Responsive** : sur téléphone, les textes sont centrés ; le soleil reste au-dessus du texte qu'on lit et ne monte
  ou ne se couche qu'entre deux textes.

## Ce qui fait « IA » (refusé, ne pas remettre)

- Mise en page type : petite ligne au-dessus du titre + titre en deux couleurs + paragraphe + deux boutons + petite
  ligne en dessous.
- Pastilles en verre dépoli (`backdrop-filter`) : remplacées par des aplats mats `#0B1030`.
- Apparition des textes par flou → net avec décalage (stagger).
- Ombre floue derrière les textes, halo sombre (« projecteur ») derrière les textes.
- Lumière qui suit la souris, flèche « Faites défiler » qui rebondit.
- Éléments lisses au milieu du pixel art (cadre de hublot en dégradés CSS, halo rouge flou…).
- Légendes du type « Ici viendra… » : mettre du vrai contenu.
- Bouton « Plan de vol » de débogage : supprimé.

## Décor : ce qui a été essayé et refusé

- Hublot avec cadre en CSS et zoom (premier proto) : « on ne comprend pas qu'on prend de la hauteur ». Remplacé par la
  vue plein écran au sol avec le sol en perspective.
- **Jour en pleine lumière** avec beaucoup de détails (colza, labours, voitures, arbres) : « trop de trucs, pas joli ».
  Le pixel art supporte mal les petits détails ; la nuit, avec peu de tons et des points de lumière, « fait un ensemble ».
  D'où l'heure bleue et un sol simplifié (4 tons, grandes parcelles).
- Piste mouillée qui reflète le ciel et la tour : incompréhensible, retirée.
- Étangs (taches claires), petits points jaunes dans les champs pendant la montée : retirés.
- Cumulus avec une base plate, nuages en bandes horizontales, nuages « collés » à plat à l'horizon : refusés. Solution
  actuelle : couche de nuages en perspective en haut du ciel + masses à peine aplaties près de l'horizon + un banc de
  brume au ras de l'horizon (sinon une bande vide apparaît).
- Transitions de scène par une ligne qui balaie l'écran : refusées. Les scènes changent **dans le brouillard** ; on
  entre dans le nuage par le côté où il se trouve (par le haut en montant, par le bas en descendant).
- Sommets enneigés dans la mer de nuages, cumulonimbus avec éclairs, montagnes lointaines : retirés (« mal faits »).
- Lumières de ville tirées au hasard à chaque image (scintillement) puis motif fixe à l'écran : refusés. Solution :
  lumières ancrées au sol sur une grille multi-échelle (`cityLight` dans le shader).
- Deux faisceaux au phare de la tour Eiffel : un seul.

## Défilement

- **Lenis** (comme Aria) : Jules trouve ça fluide ; un défilement maison a été jugé « pas fluide, bizarre ».
- **Freinage près des textes** : la molette et le pavé tactile sont ralentis (jusqu'à ~28 %) quand un texte approche du
  centre ; texte et paysage ralentissent ensemble. Essayés et refusés : simple ralentissement trop léger, cran
  d'arrêt (bloque au pavé tactile), pause totale du paysage, texte qui glisse à une autre vitesse que la page.
- **Pied de page** : après l'arrivée, il faut forcer (zone très freinée + ressort qui ramène à l'arrivée si on lâche
  trop tôt). Il est opaque, sous la scène, jamais par-dessus.
- Les nuages doivent bouger **avec le scroll** (et dériver doucement avec le temps).

## Son

- Bouton « Son coupé / Son de cabine », coupé par défaut. **Seulement l'ambiance** (grondement, ventilation, vibration),
  synthétisée et étouffée. Les annonces de bord ont été refusées (voix de synthèse « ralentie », puis MBROLA) ; le
  « ding » de la ceinture a été retiré avec elles (à proposer à nouveau si besoin).

## Textes

- Le texte sur l'auteur des posts (« On ne regarde jamais qui parle ») : retiré, « on s'en fiche » (Jules). Chaque
  phrase doit apprendre quelque chose au visiteur ; pas de phrases futiles (« Merci d'avoir pris de la hauteur avec
  nous » : retirée). Propositions et points à valider : `textes.md`.

## Points à valider avec Jules ou l'équipe

- Les textes qui décrivent le fonctionnement de Tower (voir `textes.md`) : notamment « un humain relit chaque note »
  (relecture avant ou après publication ?) et le signalement des erreurs.
- Les libellés exacts des verdicts (pour le futur tableau des arrivées).
- L'éclairage de nuit de la tour Eiffel et son phare font l'objet de droits pour certains usages : à vérifier avant la
  mise en ligne.
