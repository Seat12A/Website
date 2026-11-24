# Déploiement sur Vercel

Le site est un projet **Astro** entièrement statique pour l'instant : `npm run build` produit `dist/` (des fichiers
HTML, CSS, JS et les polices), que Vercel sert depuis son CDN. Aucune clé, aucune variable d'environnement n'est
nécessaire.

## Mettre en ligne (une seule fois)

1. Sur vercel.com : **Add New → Project**, importer le dépôt GitHub `seat12a/website`.
2. Vercel détecte Astro. Les réglages sont déjà dans `vercel.json` (commande `npm run build`, dossier `dist`) : ne
   rien changer.
3. **Node.js** : Astro 7 demande Node 22.23.4 ou plus récent. Dans *Settings → Build and Deployment → Node.js
   Version*, choisir la plus récente proposée (22.x ou 24.x).
4. Déployer. Ensuite, chaque push sur la branche de production redéploie le site, et chaque pull request reçoit une
   adresse de prévisualisation.
5. Domaine : *Settings → Domains*. L'adresse de production sert aux balises `canonical` et Open Graph
   (`VERCEL_PROJECT_PRODUCTION_URL`, fournie par Vercel au build). Pour forcer une autre adresse, définir `SITE_URL`
   dans les variables d'environnement du projet.

## Ce que fait `vercel.json`

- `cleanUrls` : `/methode` au lieu de `/methode.html` (Astro est réglé en `build.format: 'file'`).
- En-têtes de sécurité sur toutes les pages (`nosniff`, `Referrer-Policy`, interdiction d'être affiché dans une
  iframe, `Permissions-Policy`).
- Cache d'un an pour `/_astro/*` : ces fichiers ont un nom qui change à chaque modification.
- La page 404 (`src/pages/404.astro` → `dist/404.html`) est servie automatiquement par Vercel.

## Plus aucune dépendance externe au chargement

Le prototype chargeait Geist depuis Google Fonts et Lenis depuis un CDN. Désormais :

- les polices viennent de Fontsource (`@fontsource-variable/geist`, `@fontsource-variable/geist-mono`) et sont
  servies par notre propre domaine. Aucune requête vers Google : plus simple côté RGPD (l'adresse IP des visiteurs
  n'est pas transmise à un tiers) ;
- Lenis est installé par npm (version 1.1.13, celle du prototype, pour garder exactement le même défilement).

## Quand il faudra un serveur (cases, chatbot)

Les cases viendront de l'API de Tower et le chatbot devra l'appeler sans exposer de clé dans le navigateur. Il faudra
alors :

1. `npx astro add vercel` (installe l'adaptateur `@astrojs/vercel`) ;
2. garder les pages statiques par défaut et rendre à la demande seulement ce qui en a besoin
   (`export const prerender = false` dans la page ou la route d'API) ;
3. pour les cases, utiliser le cache de Vercel (ISR) plutôt qu'un appel à Tower à chaque visite ;
4. mettre l'adresse et la clé de l'API de Tower dans les variables d'environnement Vercel (jamais dans le dépôt, qui
   est public).

## Avant d'ouvrir la bêta au public

- **Mentions légales** : obligatoires en France pour un site édité par une association (nom, siège, directeur de la
  publication, hébergeur : Vercel Inc.). La page n'existe pas encore.
- **Confidentialité** : à rédiger, même si le site ne pose aucun cookie aujourd'hui.
- Les liens du menu et du pied de page (`data-soon`) ne mènent nulle part, et le formulaire « Vérifier » ne fait
  rien : soit on crée les pages, soit on les masque pour la bêta.
- Image Open Graph (aperçu quand on partage le lien) : à créer (1200×630, pixel art).
- Droits d'image de l'éclairage de la tour Eiffel : à vérifier (voir `decisions.md`).
