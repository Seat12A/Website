# Inspiration : le site d'Aria

Jules s'inspire du site d'Aria (https://joinariapp.com), une application Mac. Ce document décrit **les techniques**
observées (en lisant le site et les commentaires de son code), avec nos mots. **Leur code n'est pas dans ce dépôt et ne
doit pas y être copié** : il ne nous appartient pas, et ce dépôt est public. On s'inspire, on écrit le nôtre.

## Ce qu'il faut retenir

- **Tout est généré par le code** : aucun fichier image pour le ciel, les nuages, les oiseaux, la lune ou l'orbe.
  JavaScript pur, sans framework ni build. Seules dépendances : la police Geist et Lenis (défilement fluide).
- **Le secret de l'harmonie** : une seule échelle de 8 tons dans une seule teinte (le bleu `#3F6CC9`, en OKLab), dont
  la saturation retombe vers le noir et vers le blanc. Ciel, nuages, étoiles, soleil, logo : tout est dessiné avec
  cette échelle, et le tramage ne mélange que deux tons voisins. (Nous en avons tiré notre règle « une échelle par
  scène ».)
- **Tramage ordonné Bayer 4×4** sur une grille d'environ 480 cellules de large (taille de cellule
  `max(3, round(max(largeur, hauteur × 1,4) / 480))` px CSS), chaque cellule étant un nombre entier de pixels de
  l'écran pour rester nette.
- **Rendu en deux passes** : une couleur par cellule dans une petite texture, puis un carré net par cellule à la
  résolution de l'écran.
- **Le scroll raconte une journée** (matin → nuit → aube suivante) ; l'heure s'affiche dans un coin.
- **Ciel WebGL2** : trois couches de nuages (lointaine, principale en bruit déformé qui change lentement de forme,
  proche), chacune avec sa vitesse et sa parallaxe ; nuages éclairés d'en haut ou vers le soleil (« un pas vers la
  lumière » : on compare la densité un peu plus loin dans la direction de la lumière) ; lumière douce sous le pointeur ;
  nuages amincis derrière les textes (`data-dim`) pour la lisibilité.
- **Nuit** : lune éclairée comme une sphère (phase, mers, lumière cendrée, halo), Voie lactée en bande diagonale avec
  des poussières, étoiles d'une cellule (les 3 % les plus brillantes en croix de 5 cellules), scintillement lent,
  étoiles filantes toutes les 4 à 11 s, aurore.
- **Interface** : barre de navigation pleine largeur sur le hero, qui devient une pilule flottante au scroll ; titres
  Geist graisse 500, interlettrage très serré (−0,045 à −0,058 em) ; apparitions flou → net (que Jules a jugées
  « IA » chez nous : à ne pas reprendre telles quelles) ; logo du pied de page dessiné avec le même tramage.
- **Accessibilité** : `prefers-reduced-motion` respecté partout.

## Pour étudier le site

Ouvrir https://joinariapp.com dans un navigateur, outils de développement → onglet Sources : les scripts (`sky-gl.js`,
`journey.js`, `site.js`, `birds.js`, `orb.js`, `pages.js`) ne sont pas minifiés et commencent chacun par un long
commentaire explicatif. Une copie locale pour étude peut être faite avec `wget -p -k -E -nH https://joinariapp.com/`,
**hors de ce dépôt**.
