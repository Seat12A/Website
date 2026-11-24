# Seat 12A : plan de la page d'accueil

> **Plan de départ (24/11/2026).** Le prototype s'en est écarté sur plusieurs points (vue plein écran au sol plutôt
> qu'un hublot encadré, heure bleue au départ, nuit sur Paris à l'arrivée, sections simplifiées). Ce qui fait foi :
> `decisions.md` et `accueil.md`. Les idées non encore réalisées (la traversée animée, le tableau des
> arrivées, la carte de consignes) restent valables.

> Document de cadrage pour le développement. Il décrit le concept, chaque section, les textes, les animations et les
> petits détails. Les valeurs chiffrées (durées, couleurs, altitudes) sont des points de départ à ajuster à l'œil.

---

## 1. L'idée centrale : un vol, vu du siège 12A

Le siège 12A est **côté hublot, au-dessus de l'aile**. Toute la page est **un vol**, vu par ce hublot.

La métaphore porte le message de Seat 12A :

| Phase du vol | Ce qu'on voit | Ce que ça dit du fact-check |
|---|---|---|
| Au sol, dans la brume | Ciel gris-bleu, flou, bruité | Le bruit d'Internet : tout circule, rien n'est clair. |
| Dans les nuages | Blanc dense, turbulences, signal ceinture allumé | L'enquête : on traverse le flou méthodiquement. |
| **La percée** | On sort des nuages : soleil, bleu profond, mer de nuages en dessous | **La clarté.** C'est le moment le plus lumineux de la page. |
| Croisière | Ciel calme, plus sombre vers le haut (vrai phénomène en altitude) | Les résultats, posés et lisibles. |
| Descente, atterrissage | Coucher de soleil, puis nuit, feux de piste | On vous ramène au sol, avec les faits. |

**Promesse en une phrase :** *prendre de la hauteur sur ce qui circule.*

Ce qui nous différencie d'Aria : chez eux, le scroll fait passer **le temps** (une journée). Chez nous, il fait gagner
**de l'altitude** (un vol). Le hublot, l'aile, les codes de l'aviation et la percée des nuages sont à nous.

---

## 2. Structure : 6 sections, courte et dense

| # | Section | Phase | Hauteur indicative |
|---|---|---|---|
| 1 | Le hublot (hero) | Sol, brume | 100vh + 60vh de zoom |
| 2 | La traversée (comment ça marche) | Dans les nuages, puis la percée | Épinglée ≈ 300vh |
| 3 | Arrivées (dernières cases, en direct) | Croisière | ≈ 110vh |
| 4 | Consignes de sécurité (principes) | Croisière | ≈ 100vh |
| 5 | Embarquer (chatbot + extension) | Début de descente | ≈ 90vh |
| 6 | Atterrissage (footer) | Nuit, piste | ≈ 80vh |

Total ≈ 8 à 9 hauteurs d'écran. Pas une section de plus : chaque section doit être irréprochable.

### Chronologie du scroll (le « plan de vol »)

Un seul objet `flight` (0 → 1) calculé depuis le scroll pilote le ciel, l'indicateur d'altitude et les ambiances.

| `flight` | Altitude affichée | Ciel | Signal ceinture |
|---|---|---|---|
| 0.00 – 0.08 | 0 → 1 500 ft | Brume gris-bleu, nuages bas | Allumé |
| 0.08 – 0.40 | 1 500 → 18 000 ft | Dans la couche : blanc/gris dense, nuages qui défilent vers le bas | Allumé |
| **0.40** | **Percée** | Flash de lumière doux, la couche passe sous nous | S'éteint (« ding ») |
| 0.40 – 0.70 | FL350 (stable) | Bleu profond, dégradé plus sombre en haut, soleil, mer de nuages en bas | Éteint |
| 0.70 – 0.88 | FL350 → 3 000 ft | Heure dorée → crépuscule (ambre, rose, violet) | Rallumé à 0.80 |
| 0.88 – 1.00 | 3 000 → 0 ft | Nuit, pluie sur le hublot, feux d'approche | Allumé |

---

## 3. Éléments présents sur toute la page

### 3.1 Le ciel (canvas fixe derrière la page)

- **Technique :** WebGL2 avec un repli en canvas 2D. Nuages en bruit fractal (fBm), **tramage ordonné Bayer 4×4** sur
  une grille de cellules de 3 px (CSS), palette réduite par phase (voir §5). C'est notre propre implémentation
  (s'appuyer sur les tutoriels Codrops et Maxime Heckel, pas sur le code d'Aria).
- **Trois couches de nuages** (lointaine, principale, proche), chacune avec sa propre vitesse. Pendant la montée, elles
  défilent **vers le bas** (on monte), la couche proche plus vite que les autres.
- **Mer de nuages** en croisière : la couche principale descend et reste en bas de l'écran, ses sommets éclairés par le
  soleil.
- **Uniforms du shader :** `uFlight`, `uTime`, `uPointer`, `uDim` (zones de texte à éclaircir), `uPalette` (interpolée
  entre phases).
- **Lisibilité :** derrière les blocs de texte marqués `data-calm`, les nuages s'éclaircissent (densité réduite), sans
  poser de voile sombre.

### 3.2 L'indicateur de vol (coin bas gauche)

Une petite pastille en Geist Mono, façon instrument :

```
▲ 12 400 ft · −9 °C
```

- L'altitude **défile comme un compteur** (chiffres qui roulent) au rythme du scroll, avec une flèche ▲ / ▼ / ▬ selon
  qu'on monte, descend ou reste en palier.
- La température extérieure suit l'atmosphère standard : 15 °C au sol, **−54 °C à FL350**. Seuls les vrais passionnés
  le remarqueront, et c'est voulu.
- À la croisière, la pastille affiche `FL350 · −54 °C`.
- Juste à côté, une **icône de signal ceinture** (pictogramme pixel) : allumée en ambre dans les nuages, elle s'éteint à
  la percée avec un petit halo qui disparaît. Au survol, une infobulle : « Signal ceinture éteint. Vous pouvez circuler. »
- Au sol à la fin : `0 ft · Bienvenue`.

### 3.3 La navigation

- En haut : transparente sur le hero, puis elle devient **une pilule flottante** au scroll (fond verre dépoli, bordure
  1 px à 12 % d'opacité).
- **Logo :** « Seat 12A », où « 12A » est dans **une plaque de rangée** comme au-dessus des sièges (petit pictogramme de
  hublot + `12A`). Au survol, le volet du mini-hublot cligne (descend puis remonte, 300 ms).
- **Liens :** Cases · Demander · Méthode · À propos.
- **Bouton principal :** « Installer l'extension » (gratuit).
- Mobile : un bouton menu qui ouvre un panneau comme **un coffre à bagages** (il pivote depuis le haut).

---

## 4. Les sections en détail

### Section 1 — Le hublot (hero)

**Objectif :** en 3 secondes, comprendre ce qu'est Seat 12A et avoir envie de scroller.

**Visuel**
- Fond : intérieur de cabine très sobre (gris chaud presque blanc, léger grain). Au centre-droit, **un hublot**
  (rectangle arrondi vertical, ratio ≈ 2:3, environ 38 % de la largeur de l'écran sur desktop).
- Dans le hublot, le ciel tramé en brume, et **le bout de l'aile gauche** en pixel art dans le coin inférieur, avec son
  winglet.
- **Le feu de navigation est rouge** (l'aile gauche porte toujours le feu rouge, et le siège A est à gauche) et reste
  allumé. Le **stroboscope blanc fait un double flash** toutes les 1,5 s, comme sur un vrai avion de ligne.
- **Détails du hublot :** cadre en plastique crème avec un léger dégradé, double vitrage (un deuxième contour décalé de
  6 px), et **le petit trou de respiration** (4 px, en bas au centre de la vitre intérieure). Presque personne ne le
  connaît, mais il est sur tous les vrais hublots.
- **Reflet :** un reflet diagonal très léger sur la vitre, qui glisse dans le sens opposé à la souris (amplitude max
  12 px).

**Texte (à gauche du hublot)**
- Petite ligne en Mono, au-dessus du titre : `SIÈGE 12A · CÔTÉ HUBLOT`
- Titre (2 lignes, la 2ᵉ dans une couleur plus douce) :
  - **Prenez de la hauteur**
  - **sur ce qui circule.**
- Sous-titre : « Seat 12A vérifie les affirmations qui circulent sur X, en français, sources à l'appui. Sans regarder
  qui parle. Sans rien vendre. »
- Boutons : **Voir les cases** (principal) · **Demander une vérification** (secondaire, contour).
- Ligne en Mono sous les boutons : `Association à but non lucratif · Gratuit · Sans pub`

Autres titres possibles : « Au-dessus du bruit. » / « Vue dégagée sur l'info. »

**Animation d'entrée (au chargement)**
1. 0 ms : le **volet du hublot est baissé** aux trois quarts. On devine la lumière par la fente.
2. 200 ms : le volet remonte en 900 ms (`cubic-bezier(.22,1,.36,1)`), avec un petit rebond de 4 px en fin de course,
   comme un vrai volet qui bute.
3. En parallèle : le titre apparaît ligne par ligne (flou 8 px → net, montée de 12 px, 600 ms, décalage de 90 ms).
4. 1 100 ms : premier double flash du stroboscope.

**Au scroll (0 → 0.08)**
- Le hublot **grandit jusqu'à remplir l'écran** : on « colle le nez à la vitre ». Le cadre s'agrandit puis sort de
  l'écran, le texte se décale vers la gauche et s'estompe.
- À la fin, il n'y a plus de cabine : on est dans le ciel, et le canvas fixe prend le relais sans coupure (c'est le même
  ciel, vu à travers un masque `clip-path` qui s'ouvre).

**Mobile :** le hublot passe au-dessus du texte, plus petit (70 % de la largeur), avec le même zoom.

---

### Section 2 — La traversée (comment ça marche)

**Objectif :** montrer la méthode en une seule histoire, sans schéma ennuyeux. C'est la section qui prouve qu'on est
sérieux.

**Principe :** la section est épinglée et dure ≈ 300vh de scroll. On suit **un vrai post** du début à la fin, pendant
qu'on monte à travers les nuages. Le post vient de l'API (une case « mise en avant », jamais inventée).

**Les 5 étapes**

| Étape | Ce qui se passe à l'écran | Légende (à gauche, grosse typo) |
|---|---|---|
| A. Le post | Une carte de post, **générique** (pas le logo ni la charte de X), flotte dans le nuage, légèrement floue, puis devient nette. | **Tout commence par un post.** |
| B. L'auteur disparaît | Un balayage de radar (arc vert-ambre) passe sur la carte. L'avatar, le nom, le pseudo et le nombre d'abonnés **se dissolvent en pixels tramés**, puis sont remplacés par `AUTEUR MASQUÉ`. | **On ne regarde jamais qui parle.** Ni son nom, ni son bord politique. |
| C. L'affirmation | Un soulignement se dessine sous la phrase vérifiable. Elle se détache de la carte et se replie en **bande de vol**. | **On isole ce qui est affirmé.** |
| D. L'enquête | La bande glisse dans **un rack de contrôleur aérien**. Ses colonnes se remplissent : statut `RADAR → ENQUÊTE → RELECTURE`, compteur `SOURCES 0 → 7`. Un tampon `RELU` vient de l'équipage. | **On cherche les sources. Un humain relit.** |
| E. Le verdict + la percée | Le tampon du verdict s'imprime sur la bande, avec une note de deux lignes. **Au même moment, on sort des nuages** : lumière, bleu profond, mer de nuages en dessous. | **Une note claire, sourcée, publique.** |

**Le détail qui fait tout : les bandes de vol (« strips »)**
Dans les vraies tours de contrôle, chaque avion est suivi sur une petite bande de papier rangée dans un rack. On les
reprend pour les cases :

```
┌───────────┬───────────────────────────────────┬──────────┬──────────┐
│ CASE 0142 │ « Le chômage a baissé de 30 %… »  │ SRC  07  │ TROMPEUR │
│ 23/11 14h │ économie · emploi                 │ RELU ✓   │          │
└───────────┴───────────────────────────────────┴──────────┴──────────┘
```

- Fond papier légèrement crème, bord gauche coloré selon le verdict, texte en Geist Mono.
- Le texte de l'exemple ci-dessus est fictif, pour la maquette uniquement. En production, il vient de l'API.

**Animations**
- Chaque étape est liée au scroll (et non au temps) : en remontant, on revient en arrière. Utiliser **GSAP
  ScrollTrigger** (à vérifier, mais GSAP est devenu entièrement gratuit en 2025) ou des animations CSS liées au scroll
  avec repli.
- Les nuages défilent vers le bas pendant toute la section. Le signal ceinture est allumé.
- La percée (étape E) : en 400 ms de scroll, la luminosité du ciel monte puis se stabilise, la couche de nuages passe
  sous le bas de l'écran et le signal ceinture s'éteint. **C'est le sommet émotionnel de la page.**

**Mobile :** pas d'épinglage. Les 5 étapes sont empilées, chacune avec sa petite animation déclenchée à l'apparition.

---

### Section 3 — Arrivées (dernières cases, en direct)

**Objectif :** montrer que Seat 12A est vivant, maintenant.

**Visuel :** un **tableau d'affichage d'aéroport à palettes** (split-flap), en verre sombre sur le ciel de croisière.

- Titre au-dessus : `ARRIVÉES` en Mono avec un point `● EN DIRECT` qui pulse doucement, puis le titre **Ce qui vient
  d'être vérifié.**
- **6 lignes**, colonnes :

| HEURE | CASE | AFFIRMATION | VERDICT | |
|---|---|---|---|---|
| 14:32 | 0142 | Le chômage a baissé de 30 %… | TROMPEUR | → |

- **Seules les colonnes courtes basculent** (heure, numéro, verdict) : les palettes défilent des caractères au hasard
  avant de tomber sur le bon (40 ms par palette, 3 à 8 bascules par caractère, décalage de 70 ms entre les lignes). La
  colonne « affirmation » apparaît en fondu, sinon c'est illisible.
- Survol d'une ligne : elle s'éclaire légèrement et la flèche avance de 4 px. Clic : ouvre la page de la case.
- **En direct :** abonnement au flux SSE de gate (`case.published`). Quand une case est publiée, **une nouvelle ligne
  bascule en haut** et les autres descendent. C'est la magie : quelqu'un qui reste sur la page voit les vérifications
  arriver.
- Sous le tableau : lien **Toutes les cases →**.

**Verdicts : couleur + icône + texte, jamais la couleur seule.** Couleurs choisies pour ne pas rappeler de bord politique
(voir §5).

**États à prévoir :**
- Chargement : les palettes affichent `-- : --` et défilent lentement.
- Flux SSE coupé : le point `EN DIRECT` devient gris et affiche `EN DIFFÉRÉ`.
- Aucune case : `AUCUNE ARRIVÉE POUR LE MOMENT`.

**Données :** les 6 dernières cases sont rendues côté serveur (bon pour le référencement et pour le premier affichage),
puis le flux SSE prend le relais.

---

### Section 4 — Consignes de sécurité (nos principes)

**Objectif :** dire nos valeurs de façon mémorable. C'est notre crédibilité.

**Visuel :** **la carte de consignes de sécurité** qu'on trouve dans la poche du siège. Carte plastifiée crème,
légèrement inclinée (−2°), coins arrondis, avec 4 panneaux numérotés et des **pictogrammes en pixel art** dans le style
des vraies cartes.

En-tête de la carte : `CONSIGNES DE SÉCURITÉ · SEAT 12A · À LIRE AVANT LE DÉCOLLAGE`

| # | Pictogramme | Titre | Texte |
|---|---|---|---|
| 1 | Silhouette barrée d'un masque | **L'auteur ne compte pas.** | Nos modèles ne reçoivent jamais l'auteur d'un post. Son nom, sa popularité et son bord politique ne changent ni la priorité ni le verdict. |
| 2 | Balance qui penche | **Pas de faux équilibre.** | Quand les preuves penchent d'un côté, on le dit clairement. |
| 3 | Loupe sur un document | **Les sources, toujours.** | Chaque note montre d'où elle vient. Vous pouvez tout vérifier vous-même. |
| 4 | Personnage avec un casque | **Un humain a le dernier mot.** | L'équipage relit et modère chaque note avant qu'elle reste en ligne. |

> À valider avec toi : la ligne 4 doit correspondre exactement au fonctionnement réel (relecture avant ou après
> publication).

Bas de la carte, en petit : `Rien à vendre. Pas de pub. Pas d'abonnement. Association à but non lucratif.`
Et en tout petit, en clin d'œil aux vraies cartes : `Merci de laisser cette carte à bord. Ou de la partager.`
→ lien vers la page Méthode.

**Animations et détails**
- La carte entre par le bas, comme si on la sortait de la poche du siège (montée de 60 px + rotation de 0 à −2°,
  700 ms).
- Elle s'incline légèrement en 3D selon la souris (max 4°), avec un reflet de plastification qui glisse.
- Au survol d'un panneau, son pictogramme joue **une animation de 2 images** (la balance penche, la loupe bouge…).

**Mobile :** la carte se lit à plat, panneaux empilés, sans inclinaison 3D.

---

### Section 5 — Embarquer (chatbot + extension)

**Objectif :** donner deux façons concrètes de s'en servir. Le ciel passe à l'heure dorée.

Deux cartes côte à côte :

**Carte A — L'intercom (le chatbot)**
- Visuel inspiré du **panneau au-dessus du siège** : liseuse + bouton d'appel de l'équipage.
- Titre : **Appelez l'équipage.**
- Texte : « Un doute sur une affirmation ? Posez la question. L'intercom cherche, cite ses sources, et vous dit quand il
  ne sait pas. »
- Un champ : « Collez une affirmation ou un lien… ». Le placeholder fait défiler des exemples tapés lettre par lettre
  (35 ms par lettre, pause de 2 s) :
  - « Est-ce que cette photo date vraiment de 2024 ? »
  - « Ce chiffre sur l'inflation est-il juste ? »
  - « Cette citation est-elle authentique ? »
- Le bouton d'envoi a la forme de **la touche d'appel** (pictogramme personnage). Au focus du champ, elle s'allume en
  ambre avec un léger halo, comme quand on appelle un steward.
- Envoi : redirige vers `/demander?q=…` (la page du chatbot, faite avec shadcn/ui).

**Carte B — L'extension (carte d'embarquement)**
- Visuel : **une carte d'embarquement** avec un talon détachable sur la droite, séparé par une ligne de perforations.

```
SEAT 12A · CARTE D'EMBARQUEMENT
PASSAGER   Vous            VOL     S12A
DE         Votre fil X     VERS    Les faits
PORTE      Chromium        SIÈGE   12A
EMBARQUEMENT  Maintenant   ▌▌▍▌▌▍▍▌▌▍▌  (code-barres décoratif)
```

- Texte sous la carte : « L'extension repère les posts à vérifier et affiche nos notes, directement sur X. »
- Bouton : **Installer l'extension** (Chrome, Edge, Brave… tous les navigateurs Chromium).
- **Détail :** au survol, le talon se soulève légèrement le long des perforations. Au clic, il **se détache** (rotation
  de 8° + chute de 20 px, 350 ms), puis la boutique d'extensions s'ouvre.

**Mobile :** les deux cartes sont empilées. Sur mobile, la carte B indique « Disponible sur ordinateur » (pas
d'extension sur mobile).

---

### Section 6 — Atterrissage (footer)

**Objectif :** finir en beauté et refermer l'histoire.

**Visuel**
- Le ciel passe du crépuscule à la nuit. **Le cadre du hublot revient** : l'inverse du zoom du hero, la vitre se
  referme autour de la vue.
- Sur la vitre, **des gouttes de pluie filent à l'horizontale** (à grande vitesse, la pluie ne coule pas, elle file en
  biais). Quelques traits pixel, pas plus.
- En bas, **la rampe d'approche** : une ligne de feux blancs qui s'allument en séquence vers le seuil de piste (le
  « lapin » des vrais aéroports, un flash qui court en boucle toutes les 2 s), puis les feux verts du seuil.
- L'indicateur passe à `0 ft · Bienvenue`.
- Dernière phrase, centrée, en grand : **Vous pouvez détacher votre ceinture.** Le signal ceinture s'éteint une
  dernière fois.

**Contenu du footer (sous la piste)**
- Colonnes : **Seat 12A** (Cases, Demander, Extension) · **Comprendre** (Méthode, Principes, FAQ) · **L'association**
  (À propos, Transparence et financement, Contact) · **Légal** (Mentions légales, Confidentialité).
- Ligne de fin : `© 2026 Seat 12A · Association à but non lucratif · Indépendante de X et de tout parti politique.`
- Bouton retour en haut : **Redécoller ↑**. Au clic, scroll fluide vers le haut, et l'altitude remonte en direct dans
  l'indicateur pendant le trajet.

---

## 5. Design system

### Typographie
- **Geist** (texte et titres) et **Geist Mono** (indicateurs, tableau, bandes, cartes) : open source, licence OFL.
- Titres : graisse 500, interlettrage −0,045em, interligne 0,95–1,05, 2ᵉ ligne dans une couleur plus douce.
- Étiquettes Mono : majuscules, interlettrage +0,08em, 11–12 px.

### Couleurs (points de départ)

| Rôle | Valeur |
|---|---|
| Cabine (fond hero) | `#F2F0EC` |
| Brume (sol) | `#9AABBE` → `#C9D3DE` |
| Nuage (intérieur) | `#E6EBF2` → `#FFFFFF` |
| Croisière haut → bas | `#0E2A6B` → `#2F5FC4` → `#8DB2EE` |
| Heure dorée | `#F2A65A` → `#E07A6B` → `#6B4C9A` |
| Nuit | `#0A0F24` |
| **Accent signal (ambre ATC)** | `#FFB020` |
| Papier (bandes, cartes) | `#F7F3E8` |

**Verdicts** (non partisans, toujours avec icône + texte) :

| Verdict | Couleur | Icône |
|---|---|---|
| Vrai | Sarcelle `#2BA59A` | ✓ |
| Trompeur | Ambre `#E9A23B` | ◐ |
| Faux | Corail `#E0655A` | ✕ |
| Contexte manquant | Lavande `#8C7BD6` | … |
| Non vérifiable | Gris `#8A93A3` | ? |

> À aligner avec les verdicts réels de Tower : les libellés doivent être exactement ceux de l'API.

### Mouvement
- Courbe par défaut : `cubic-bezier(.22,1,.36,1)`. Durées : 200 ms (survol), 600 ms (apparition), 900 ms (gros
  mouvements).
- Apparitions : flou 8 px → net + montée de 12 px.
- Défilement fluide : **Lenis** (`lerp: 0.1`), désactivé sur écrans tactiles.

---

## 6. Accessibilité, performance, technique

**Accessibilité**
- `prefers-reduced-motion` : ciel figé sur une image par phase, volet déjà ouvert, pas de zoom, tableau sans bascule,
  pas d'épinglage. **La page doit rester belle et complète.**
- Tous les canvas en `aria-hidden`. Le tableau des arrivées est un vrai `<table>` lisible par les lecteurs d'écran.
- Contraste AA minimum sur tous les textes (le système `data-calm` du ciel est là pour ça).
- Navigation complète au clavier, focus visible (anneau ambre).

**Performance** (Railway facture la RAM, et les visiteurs n'ont pas tous un bon PC)
- Canvas à basse résolution (cellules de 3 px), DPR plafonné à 2, boucle d'animation en pause quand l'onglet est caché
  ou que le ciel est hors écran.
- Repli 2D si WebGL2 est absent. Qualité réduite automatiquement si les images tombent sous 45 fps.
- Objectifs : Lighthouse ≥ 90 sur mobile, LCP < 2 s, moins de 60 Ko de JS pour la page (hors Lenis et GSAP).
- Page rendue côté serveur par Astro et mise en cache. Seuls le ciel, le tableau et l'intercom sont des îlots
  interactifs.

**Ce que la page demande à Tower (gate)**
- `GET` case mise en avant : affirmation, verdict, nombre de sources, note courte, slug. **Sans l'auteur.**
- `GET` 6 dernières cases publiées (mêmes champs, sans l'auteur).
- Flux SSE : événement `case.published` avec les mêmes champs.

---

## 7. Petits détails qui rendent la page magique (récap)

1. Le volet du hublot qui remonte au chargement, avec un rebond.
2. Le feu rouge de l'aile gauche et le double flash du stroboscope.
3. Le trou de respiration sur la vitre.
4. L'altitude qui roule et la température qui descend jusqu'à −54 °C.
5. Le signal ceinture qui s'éteint à la percée des nuages.
6. Le ciel plus sombre en altitude, comme en vrai.
7. L'auteur qui se dissout en pixels sous le radar.
8. Les bandes de contrôleur aérien pour les cases.
9. Le tableau à palettes qui affiche les cases en direct.
10. La carte de consignes de sécurité, avec son « merci de la laisser à bord ».
11. La touche d'appel qui s'allume quand on écrit.
12. Le talon de la carte d'embarquement qui se détache.
13. La pluie à l'horizontale, les feux d'approche et « Vous pouvez détacher votre ceinture ».
14. « Redécoller ↑ » qui fait remonter l'altitude.

**Bonus si on a le temps :**
- Le ciel du hero suit l'heure réelle du visiteur (de nuit, on décolle au-dessus des **lumières d'une ville** en pixels).
- Le favicon est un mini-hublot jour/nuit selon l'heure.
- Un interrupteur « son cabine » discret (ronronnement + « ding » à la percée), **coupé par défaut**.

---

## 8. Ordre de développement conseillé

1. **Le ciel** (shader + palettes par phase + objet `flight`) : c'est la fondation. Le valider seul avant tout le reste.
2. **Le hero** (hublot, volet, aile, zoom).
3. **La traversée** (la section la plus difficile, à faire tôt).
4. Arrivées (avec de fausses données, puis le branchement sur l'API et le SSE).
5. Consignes, Embarquer, Atterrissage.
6. Passe accessibilité et mouvement réduit, puis passe performance.
7. **Passe détails** : c'est elle qui fait la différence, prévoir du temps.

## 9. Questions ouvertes

- Le titre final du hero (3 propositions en section 1).
- Les libellés exacts des verdicts dans Tower.
- La relecture humaine : avant ou après publication ? (ça change le texte de la consigne 4)
- Le nom affiché du chatbot : « l'intercom » ?
- Le lien de la boutique d'extensions, et la date de sortie de l'extension.
