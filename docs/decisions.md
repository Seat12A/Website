# Décisions de design et retours de Jules

Ce document rassemble ce qui a été décidé pour la page d'accueil, et surtout **ce que Jules a refusé**, pour ne pas
refaire les mêmes erreurs. Il est issu de la session du 24/11/2026 (une trentaine d'itérations sur le prototype),
complété au passage en bêta puis le 25/11/2026 (textes, illustrations, boutons, volet d'arrivée).

## Le concept

- **Un vol vu du siège 12A** : hublot gauche, au-dessus de l'aile. Le scroll fait **gagner de l'altitude** (et non
  passer le temps comme chez Aria). Métaphore : prendre de la hauteur sur ce qui circule pour y voir clair.
- **Déroulé** : heure bleue au sol (aéroport éclairé, étoiles, croissant de lune) → décollage → montée en virage à
  gauche, le sol s'éloigne → le soleil se lève *parce qu'on monte* (phénomène réel) → entrée progressive dans les
  nuages → croisière au-dessus d'une mer de nuages → heure dorée → descente dans les nuages → nuit sur Paris
  (tour Eiffel et son phare, Seine, monuments) → atterrissage face à la tour de contrôle.
- Le titre du hero : « Prenez de la hauteur sur ce qui circule. » (Jules veut le garder comme phrase principale.)
- **L'histoire racontée par les textes** (25/11/2026) : au sol et dans le nuage, on n'y voit rien (les réseaux, très
  polarisants, surtout pendant les élections) ; à la percée, on y voit clair (ce que fait Seat 12A : vérifier,
  remettre en contexte, nuancer) ; en croisière, comment on travaille (rien à vendre, code ouvert, méthode publique)
  et ce qui vient (de petites études sur les données) ; au-dessus de Paris la nuit, la beauté d'Internet.

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
- **Textes toujours centrés** (25/11/2026) : à gauche, ils passaient sur l'aile et se lisaient mal. La classe `.left`
  existe encore dans le code mais n'est plus utilisée.
- **Responsive** : sur téléphone, les textes sont centrés ; le soleil reste au-dessus du texte qu'on lit et ne monte
  ou ne se couche qu'entre deux textes.
- **Les textes sont illustrés par le décor lui-même** (25/11/2026), avec des phénomènes réels qu'on voit depuis un
  hublot, rendus comme une ambiance (Jules : « avec les pixels, il est difficile de faire des trucs précis, c'est plus
  une ambiance globale ») :
  - à la percée (« Vérifier… ») : **halo de 22° et parhélies** autour du soleil bas (un soleil, trois images) ;
  - dans le nuage (« on y voit mal ») : chaque **flash du stroboscope illumine le brouillard** (les pilotes peuvent
    les couper en nuage : ils éblouissent) ;
  - à l'heure dorée (« Un doute ? ») : un autre avion passe plus haut, sa **traînée** s'élargit et se défait. Son
    ombre sur la mer de nuages a été **retirée** (Jules : « le reflet de l'avion sur les nuages ») ;
  - au-dessus de Paris (« On aime Internet ») : **Paris n'est plus dessiné en points lumineux** (« catastrophique »,
    ils apparaissent et disparaissent au défilement) mais en **nappe de lumière chaude** continue, accrochée au sol et
    assez floue pour ne jamais scintiller : quartiers plus ou moins lumineux, parcs sombres, avenues de l'Étoile,
    quais de Seine, quelques rues par endroits (toutes les rues faisaient un grillage). Une petite rampe de l'accent
    chaud (4 intensités, tramées entre voisines). De grandes vagues lentes la traversent (le réseau).
    Refusé : des pointillés et des éclats le long des rues (« trop précis, pas une ambiance ») ;
  - à l'approche : le **« lapin »**, l'éclair qui court sur les feux d'approche d'une piste parallèle.
  - **le faisceau de la tour Eiffel**, refait deux fois (« toujours pas naturel ») : il **tourne avec le défilement**,
    pas avec le temps. Physique : droite en 3D vue en perspective ; plus fin et plus pâle au loin (sa lumière
    s'étale), jamais plus large qu'il ne faut à l'écran ; diffusion vers l'avant de la brume (bien plus brillant quand
    il vient vers nous) ; brume inégale fixée dans l'air ; caché par les bâtiments, le sol et l'aile qui sont devant ;
    une petite lueur à la lampe. Garé, il monte en travers du ciel au-dessus du terminal. Toujours un seul faisceau.
  Essayé et retiré : le front de la vague du réseau en anneau plein (un aplat orange à l'horizon, laid).
- **Le flash n'éclaire l'aile que dans le nuage** : hors du nuage, une lumière qui n'éclairait que l'aile « fait
  bizarre ».
- **Dans le brouillard, l'aile disparaît aussi** (Jules) : d'autant plus vers le bout (17 m) qu'à l'emplanture (2 m).
  Le flash du stroboscope est surtout une grande lueur diffuse autour du bout d'aile, avec des faisceaux à peine
  marqués (une première version en étoile de rayons faisait « soleil dessiné »).
- **La traînée est accrochée au ciel, pas à l'avion** : chaque morceau vieillit sur place pendant que l'avion avance.
  Calculée par rapport à l'avion, elle avançait d'un bloc avec lui, « comme une banderole tirée par un avion ».
- **Petites illustrations à côté des textes : refusées** (25/11/2026). Essayé : un post qui se propage, une note de
  contexte qui se déplie, un radar, une fenêtre de navigateur, un panneau ceinture (petits dessins pixel de ~200 px).
  Jules : « j'aime pas les petites illustrations comme ça, pas du tout ; pas un truc semi-petit : soit un truc
  impressionnant mais vraiment magnifique, soit rien ». Les pictogrammes 16×16 à côté des titres restent.
- **Boutons** (25/11/2026) : au survol, le bouton passe en bleu ciel pâle et un reflet en pixels (une bande épaisse et
  une fine, en escalier sur la grille) le traverse par crans, en boucle. Kitsch, voulu. Les petites étoiles qui
  clignotent aux coins ont été proposées et **refusées**.
- **Animation d'arrivée** (25/11/2026) : la scène apparaît cellule par cellule, en tramage (Bayer 8×8), en s'ouvrant
  depuis le milieu de l'écran, avec un liseré de cellules plus claires au front (`intro.js`, environ 1,2 s). Abstraite
  exprès. Refusé : un volet de hublot qui remontait (« comme une porte de garage, un truc concret »). Pas de fondu,
  pas de flou, pas de décalage entre les textes. Rien si le visiteur demande moins d'animations.
- **Chaque texte est pile au milieu de l'écran quand sa scène est à son maximum** (Jules, 25/11/2026) : hero au sol
  (0), « on y voit mal » au cœur du nuage (0,28), « Ce que fait Seat 12A » quand les parhélies sont pleinement
  visibles (0,49), « Gratuit… » soleil au plus haut (0,6), « Un doute ? » traînée développée (0,72), « On aime
  Internet » réseau de Paris au maximum (0,9), arrivée garée (1). Plus aucun décalage `data-y`. Pour que ça tienne :
  à l'arrivée l'horizon descend à 0,22 (le texte passe au-dessus des bâtiments) ; à 0,9 il monte à 0,73 (le centre
  lumineux de Paris passe au-dessus du texte) ; la ville est un peu adoucie derrière le texte lu.
- **Téléphone** (25/11/2026, « tout est bizarre, les nuages se chevauchent ») : la scène, faite pour un écran large,
  n'en montrait qu'une tranche agrandie (nuages en bandes empilées, pixels énormes). Désormais, en portrait, le champ
  de vision s'élargit (`uZoom`, jusqu'à 1,8) en gardant l'horizon et la mer de nuages à la même hauteur d'écran, et
  les cellules font 2 px CSS au lieu de 3 (environ 195 de large). Le soleil monte juste après la sortie des nuages
  (0,44–0,47) et reste au-dessus des textes en croisière.

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
- **Pied de page : supprimé partout** (Jules, 25/11/2026 : « j'aime pas »), sur l'accueil comme sur les autres pages ;
  le frein et le ressort qui y menaient sont partis avec. Avant : après l'arrivée, il fallait forcer (zone très freinée + ressort qui ramène à l'arrivée si on lâche
  trop tôt). Il est opaque, sous la scène, jamais par-dessus.
- Les nuages doivent bouger **avec le scroll** (et dériver doucement avec le temps).

## Son

- Bouton « Son coupé / Son de cabine », coupé par défaut. **Seulement l'ambiance** (grondement, ventilation, vibration),
  synthétisée et étouffée. Les annonces de bord ont été refusées (voix de synthèse « ralentie », puis MBROLA) ; le
  « ding » de la ceinture a été retiré avec elles, puis **remis le 25/11/2026** à un seul endroit : quand le panneau
  ceinture s'éteint à l'arrivée, et seulement si le son est allumé. À retirer si Jules ne l'aime pas.

## Textes

- Le texte sur l'auteur des posts (« On ne regarde jamais qui parle ») : retiré, « on s'en fiche » (Jules). Chaque
  phrase doit apprendre quelque chose au visiteur ; pas de phrases futiles (« Merci d'avoir pris de la hauteur avec
  nous » : retirée). Propositions et points à valider : `textes.md`.
- **Expliquer le concept, pas la cuisine** (25/11/2026) : « D'abord, on isole ce qui est affirmé » (« on s'en tape »)
  et « Une erreur dans une case ? Dites-le-nous » (« on s'en fiche ») sont retirés. Quelqu'un qui ne connaît rien
  doit comprendre ce qu'est Seat 12A.
- **Jamais le mot « case »** pour les visiteurs : « fact-check » (menus, boutons) ou « vérification » (phrases).
- **Jamais « association »** : Seat 12A n'a pas de statut juridique. On peut mettre en avant qu'on ne vend rien, que
  tout le code est public et que la méthode l'est aussi.

## Chargement

- Avant que le script démarre, la page n'affiche que le fond (couleur du volet fermé) : plus jamais toutes les
  sections empilées au centre (bug vu par Jules le 25/11/2026, quand le script tarde ou échoue). Si le script ne
  démarre pas en 6 s, ou sans JavaScript, les textes s'affichent comme une page simple, lisible.

## La page 404

- **Demande de Jules (25/11/2026)** : reprendre le style de l'accueil, avec un avion crashé ou qui se crashe, « mais
  que ça soit mignon et joli ». Fait : la scène de l'accueil (même shader, même plan de vol) **figée à l'heure bleue au
  sol** (f = 0 : aéroport, étoiles, croissant de lune), avec l'arrivée cellule par cellule ; devant, un **petit avion de
  ligne dodu, le nez planté dans une butte de terre à côté de la piste**, la queue en l'air, les hublots encore allumés
  (l'accent chaud), la fenêtre de Seat 12A sur la dérive, trois bouffées de fumée qui montent par crans et que le vent
  emporte. Pixel art sur la grille des cellules, dans l'échelle de tons de la scène, dessiné par le code (`lost/crash.js`).
- Évité : la fumée tramée contre le ciel (elle faisait le « grillage de petits carrés » déjà refusé) ; un avion trop
  petit (« soit un truc impressionnant, soit rien »). **À valider par Jules.**

## Les autres pages (fact-checks…)

- **Minimalistes, shadcn/ui obligatoire, clair par défaut et sombre si l'ordinateur l'est** (Jules, 25/11/2026).
  **Ne pas recopier un style avion** : une première version sombre en « tableau des arrivées » a été remplacée.
- **Deuxième refonte le même jour** : la première version shadcn (style new-york, tableau, pictogrammes pixel partout,
  ligne tramée sous un en-tête à part) a été jugée « absolument catastrophique ». Demandes de Jules :
  - **l'en-tête doit être le même que sur l'accueil**, tout en continuité dans le site : l'en-tête est maintenant le
    composant de l'accueil (`chrome.css`) ;
  - **composants officiels shadcn/ui, style Maia**, **thème bleu** en couleur d'accent ;
  - **inspiration Bluesky** (un seul bleu pour l'action, pilules, cartes arrondies, filets, pas d'ombres) ;
  - **filtres en chips** sur le modèle du dashboard Moddy ;
  - « moderne et minimaliste ».
- **Troisième passe, le même jour** : plus de pied de page ; **toute la largeur de la fenêtre** ; l'embed du post X
  **se charge tout seul** ; **plus de cartes à contour** ; marges revues ; **icônes Google Material** (Material Symbols)
  et **plus d'icônes pixel** ; un style « plus travaillé », mélange de Bluesky, Twitter et Linear, **plus fonctionnel** ;
  **éviter ce qui fait IA** (gros titre + paragraphe gris d'accroche, états vides avec une icône dans un carré, blocs
  décoratifs). Refusé aussi : le texte limité en largeur à côté de la colonne de droite (« une grande ligne blanche qui
  sert à rien »). Détails : `fact-checks.md`.
- **Quatrième passe** (« au petit oignon, sérieux, structuré, très lisible ») : colonnes alignées (barres de même
  hauteur à gauche et à droite, filet vertical jusqu'en bas), l'affirmation d'abord puis un **bandeau verdict / contexte
  / dates** dans un encadré **teinté sans contour**, des sections séparées par des filets aux titres identiques, la
  colonne de droite qui ne défile plus dans la page, l'**en-tête de l'accueil adapté** (aussi large que le contenu,
  liens à côté du logo). Jules accepte les encadrés s'ils sont très fins et ne font pas IA : teinte légère, ou contour
  plus foncé que d'habitude ; jamais les cartes à contour de base.
  Détails : `fact-checks.md`.
- L'affirmation vérifiée toujours entre guillemets : sinon le titre se lit comme une affirmation de Seat 12A.

## Points à valider avec Jules ou l'équipe

- Les textes qui décrivent le fonctionnement de Tower (voir `textes.md`) : notamment « un humain relit chaque note »
  (retiré en attendant), le code public de Tower et de l'extension, l'endroit où la méthode est publiée, ce que fait
  l'extension.
- Les libellés et les couleurs des verdicts (`src/lib/labels.js`, `global.css`) : repris de la doc de l'API.
- L'éclairage de nuit de la tour Eiffel et son phare font l'objet de droits pour certains usages : à vérifier avant la
  mise en ligne.
