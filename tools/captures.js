/*
 * Captures d'écran du prototype à différents points du vol, pour vérifier un changement.
 *
 * Usage :
 *   node tools/captures.js                      # points par défaut, 1280×800
 *   node tools/captures.js 0 0.2 0.55 1         # points du vol choisis (0 = au sol, 1 = arrivée)
 *   LARGEUR=390 HAUTEUR=844 node tools/captures.js 0 0.55   # format téléphone
 *
 * Les images sont écrites dans tools/captures/ (dossier ignoré par git).
 * Le rendu WebGL passe par SwiftShader (logiciel) : c'est lent mais fidèle. Les pages s'ouvrent en file://,
 * donc Lenis (chargé depuis un CDN) peut manquer : le défilement natif prend alors le relais, sans incidence ici.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const points = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const vol = points.length ? points : [0, 0.1, 0.16, 0.265, 0.42, 0.55, 0.64, 0.73, 0.82, 0.9, 1];
const largeur = Number(process.env.LARGEUR || 1280), hauteur = Number(process.env.HAUTEUR || 800);
const page = 'file://' + path.resolve(__dirname, '../prototype/accueil/index.html');
const sortie = path.resolve(__dirname, 'captures');
fs.mkdirSync(sortie, { recursive: true });

(async () => {
  const navigateur = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const onglet = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });
  const erreurs = [];
  onglet.on('pageerror', (e) => erreurs.push(e.message));
  onglet.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  await onglet.goto(page);
  await onglet.waitForTimeout(1500);
  for (const f of vol) {
    await onglet.evaluate((x) => window.seat12a.goTo(x), f);
    await onglet.waitForTimeout(700);
    const nom = `vol-${String(f).replace('.', '_')}.png`;
    await onglet.screenshot({ path: path.join(sortie, nom) });
    console.log('capturé', nom);
  }
  console.log(erreurs.length ? 'erreurs : ' + erreurs.join(' | ') : 'aucune erreur');
  await navigateur.close();
})();
