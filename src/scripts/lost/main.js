/*
 * The 404 page: the home page's scene (same shader, same flight plan), held at one point of the flight: blue hour on
 * the ground, before take-off (f = 0: airport lights, stars, the waning crescent). Only time moves (stars, clouds,
 * strobe, shooting stars). In front, a little airliner that missed its gate, drawn on the scene's cell grid with the
 * scene's tones (crash.js). The scene appears cell by cell, like the home page (intro.js).
 */
import { CITY_START, GROUND_END, NIGHT_START, RUNWAYS, beacon, contrail, groundLights, halo, horizon, moonPosition, network, sky, sunPosition, tilt, travel } from '../home/flightPlan.js';
import { createMeteors, strobe } from '../home/effects.js';
import { createIntro } from '../home/intro.js';
import { cellSize, createRenderer } from '../home/renderer.js';
import { clamp } from '../home/util.js';
import { createCrash } from './crash.js';

const F = 0;
const $ = (s) => document.querySelector(s);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const canvas = $('#sky');
let renderer = createRenderer(canvas);
if (!renderer) root.classList.add('no-webgl');
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); renderer = null; root.classList.add('no-webgl'); });
canvas.addEventListener('webglcontextrestored', () => { renderer = createRenderer(canvas); if (renderer) root.classList.remove('no-webgl'); });

let cell = cellSize();
const crash = createCrash($('#crash'), reducedMotion);
function onResize() {
  cell = cellSize();
  root.style.setProperty('--cell', cell.css + 'px');
  renderer?.resize();
  crash.resize(cell.css);
}
onResize();
addEventListener('resize', onResize);

const drawIntro = createIntro($('#intro'), reducedMotion);
const meteor = createMeteors(reducedMotion);
const text = $('.lost');
let introOn = true;

/* the sky behind the text gets a little quieter, as on the home page */
function calmRect() {
  const r = text.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  return [r.left / W, 1 - r.bottom / H, r.right / W, 1 - r.top / H, 1];
}

const t0 = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const S = sky(F), hz = horizon(F), tl = tilt(F);
  const portrait = innerWidth < innerHeight * .9;
  const zoom = portrait ? clamp(innerHeight / innerWidth, 1, 1.8) : 1;
  const toScene = (y) => .5 + (y - .5) * zoom;
  const sun = sunPosition(F, hz, S.sunSize, portrait, zoom);
  const time = reducedMotion ? 40 : (now - t0) / 1000;

  if (renderer) {
    try {
      renderer.draw((gl, U) => {
        const { gw, gh } = renderer.size;
        gl.uniform1f(U.uTime, time); gl.uniform3fv(U.uPal, S.pal.flat());
        gl.uniform1f(U.uSea, toScene(S.sea)); gl.uniform1f(U.uFog, S.fog); gl.uniform1f(U.uCover, S.cover);
        gl.uniform1f(U.uTop, S.top); gl.uniform1f(U.uBot, S.bot); gl.uniform1f(U.uLo, S.lo); gl.uniform1f(U.uHi, S.hi);
        gl.uniform1f(U.uGlow, S.glow); gl.uniform1f(U.uRays, S.rays); gl.uniform1f(U.uStars, S.stars);
        gl.uniform1f(U.uOffY, 0); gl.uniform1f(U.uFlash, 0);
        gl.uniform3fv(U.uSun, sun); gl.uniform2fv(U.uWing, S.wing);
        gl.uniform1f(U.uGround, F < GROUND_END || F > NIGHT_START ? 1 : 0);
        gl.uniform1f(U.uH, 4); gl.uniform1f(U.uTravel, travel(F, 0));
        gl.uniform1f(U.uTilt, (tl * Math.PI) / 180); gl.uniform1f(U.uHorizon, toScene(hz));
        gl.uniform1f(U.uNight, groundLights(F)); gl.uniform1f(U.uCity, F > CITY_START ? 1 : 0);
        gl.uniform1f(U.uStrobe, strobe(now, reducedMotion)); gl.uniform1f(U.uWingS, clamp(gw / gh / 1.4, .5, 1));
        gl.uniform1f(U.uBlink, now % 1500 < 700 ? 1 : 0);
        gl.uniform1f(U.uGlint, .12 + (hz - .30) * .5 + Math.sin(time * .25) * .02);
        gl.uniform4fv(U.uRwy, RUNWAYS);
        const mo = moonPosition(F, toScene(hz)); gl.uniform4fv(U.uMoon, mo[0]); gl.uniform3fv(U.uMoonL, mo[1]);
        gl.uniform1f(U.uMilky, 0); gl.uniform1f(U.uFlightX, 0); gl.uniform1f(U.uFogDir, 1);
        const me = meteor(now, S.stars, gw / gh); gl.uniform4fv(U.uMet, me[0]); gl.uniform2fv(U.uMet2, me[1]);
        const c = calmRect(); gl.uniform4f(U.uCalm, c[0], c[1], c[2], c[3]); gl.uniform1f(U.uCalmK, c[4]);
        gl.uniform1f(U.uHalo, halo(F)); gl.uniform2fv(U.uContrail, contrail(F)); gl.uniform1f(U.uNet, network(F));
        gl.uniform1f(U.uBeam, beacon(F)); gl.uniform1f(U.uZoom, zoom);
      });
    } catch (err) { console.error(err); renderer = null; root.classList.add('no-webgl'); }
  }
  crash.draw(now, S.pal, hz);
  if (!root.classList.contains('flying')) root.classList.add('flying');
  if (introOn) introOn = drawIntro(now, S.pal, cell.css);
}
requestAnimationFrame(frame);
