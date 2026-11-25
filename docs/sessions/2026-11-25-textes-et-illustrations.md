# Session du 25/11/2026 — textes, illustrations, boutons, volet d'arrivée

## Demandes de Jules

1. Revoir les textes : on expliquait des détails « dont tout le monde se fiche » (« on isole ce qui est affirmé »).
   Quelqu'un qui ne connaît rien doit comprendre le concept : fact-check, remise en contexte des posts, nuance et recul
   sur des réseaux très polarisants, surtout pendant les élections ; plus tard, de petites études sur les données.
   Garder « Prenez de la hauteur sur ce qui circule » en phrase principale.
2. Mettre en avant qu'on ne vend rien (sans écrire « association » : pas de statut juridique), que tout le code est
   public et que les méthodes le sont aussi.
3. Remplacer la fin (« Une erreur dans une case ? ») par l'atterrissage (« vous pouvez détacher votre ceinture ») avec
   un bouton pour l'extension et un pour les fact-checks. Ne plus dire « case ».
4. Pas que du texte : des illustrations, être créatif, parler de la beauté d'Internet.
5. Boutons : un reflet pixelisé kitsch qui passe au survol (sans les petites étoiles proposées).
6. Bug : « parfois on arrive sur le site et ça affiche » toutes les sections empilées au centre.
7. Une animation quand on arrive sur le site.

## Ce qui a été fait

- **Textes et structure** (`index.astro`) : hero clarifié ; le problème dans le nuage (« Sur les réseaux, on y voit
  mal », avec l'étude du MIT de 2018, source liée) ; la percée porte le concept (« Vérifier, remettre en contexte,
  nuancer ») ; « Rien à vendre, rien à cacher » (rien à vendre, code ouvert, méthode publique, sources) ; « Bientôt :
  ce que les chiffres racontent » ; « Un doute ? » avec l'extension ; « Internet reste une merveille » au-dessus de
  Paris la nuit ; « Vous pouvez détacher votre ceinture » à l'arrivée. Détail et points à valider : `textes.md`.
- « Case » remplacé par « fact-check » / « vérification » partout pour les visiteurs (menu, boutons, pied de page).
  « Association » retiré partout (page, description, pied de page, `CLAUDE.md`).
- **Illustrations** : de petits dessins pixel à côté des textes (un post qui se propage, une note de contexte, un
  radar, un navigateur, un panneau ceinture) ont été faits puis **retirés à la demande de Jules** (« soit un truc
  impressionnant mais vraiment magnifique, soit rien » ; voir `decisions.md`). Restent de nouveaux pictogrammes 16×16 :
  code, livre, chaîne, photo légendée.
- **Boutons** : fond bleu ciel pâle et reflet en escalier de pixels qui traverse le bouton par crans, en boucle.
- **Volet d'arrivée** (`intro.js`, nouveau) : le volet du hublot couvre l'écran, se décroche, remonte et découvre la
  piste.
- **Son** : le « ding » de la ceinture revient, seulement quand l'avion est garé et si le son est allumé.
- **Bug du chargement** : reproduit (c'est l'état de la page avant que le script tourne : script lent ou en échec).
  Corrigé : on ne voit que le fond avant le script ; sans script au bout de 6 s, les textes s'affichent en page simple.
  La boucle d'animation résiste aux erreurs et à la perte du contexte WebGL.
- « Redécoller » est passé dans le pied de page. `tools/captures.js` attend la fin du volet.
- Docs : `textes.md` réécrit, `decisions.md`, `accueil.md`, `deploiement.md`, `CLAUDE.md` mis à jour.

## Vérifié

- `npm run build` sans erreur. Captures bureau (1280×800) et téléphone (390×844) de chaque texte, aucune erreur
  dans la console. Volet image par image, reflet des boutons image par image, page sans JavaScript, chargement avec un
  script retardé de 4 s.
- Non vérifié : la fluidité réelle (volet, reflet) et le ding : à regarder et écouter sur une vraie machine.

## Limites connues

- Sur téléphone, le relief de la mer de nuages remonte jusqu'au milieu de l'écran : le bas de « Nuancer » et de « Les
  sources, toujours » passe sur des nuages clairs, moins lisible. Pistes : raccourcir encore ces textes, ou baisser le
  relief de la mer de nuages en mode portrait (toucherait au décor, à décider avec Jules).
- Le volet joue à chaque chargement de la page, même en revenant d'un autre onglet : à limiter à la première visite
  si ça lasse.

## À faire ensuite

- Valider ce que les textes affirment (`textes.md`) : Tower et l'extension publics ? où est la méthode ? que fait
  l'extension ? Créer la page Méthode avant d'ouvrir la bêta.
- Jules : regarder le volet et le reflet des boutons à l'œil ; écouter le ding.
- Si on veut une illustration, ce sera une seule, grande et soignée, de préférence dans la scène elle-même (voir les
  pistes proposées à Jules en fin de session).
