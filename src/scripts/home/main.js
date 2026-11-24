/*
 * Home page: a flight seen from seat 12A (left window, above the wing), driven by scrolling.
 *
 *   scroll ──► f ∈ [0, 1], progress of the flight
 *              ├─► sky(f)              palette and sky parameters (flightPlan.js)
 *              ├─► altFt, tilt, horizon, travel     camera
 *              ├─► sunPosition, moonPosition        one sun, one day (see flightPlan.js)
 *              └─► uniforms ──► renderer (pass 1: one colour per cell, pass 2: sharp squares) ──► screen
 */
import { createCabinSound } from './cabinSound.js';
import { createMeteors, strobe } from './effects.js';
import { altFt, CITY_START, GROUND_END, groundLights, horizon, moonPosition, NIGHT_START, RUNWAYS, sky, sunPosition, tilt, travel } from './flightPlan.js';
import { createAltimeter, createPictos } from './hud.js';
import { createRenderer } from './renderer.js';
import { createScroll } from './scroll.js';
import { clamp, smooth } from './util.js';

const $ = (s) => document.querySelector(s);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = $('#sky');
const renderer = createRenderer(canvas);
if (renderer) addEventListener('resize', renderer.resize);
else document.documentElement.classList.add('no-webgl');

const sections = Array.from(document.querySelectorAll('.sec'));
const scroll = createScroll({ track: $('#track'), sections, reducedMotion });
const updateAltimeter = createAltimeter($('#digits'), $('#plane'));
const drawPictos = createPictos(Array.from(document.querySelectorAll('.picto')));
const meteor = createMeteors(reducedMotion);
const nav = $('#nav');

/* ---------- Buttons and links ---------- */
$('#takeoff')?.addEventListener('click', () => scroll.go(0));
$('#home')?.addEventListener('click', (e) => { e.preventDefault(); scroll.go(0); });
document.querySelectorAll('[data-soon]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
$('#ask')?.addEventListener('submit', (e) => e.preventDefault());

const sound = createCabinSound(), soundBtn = $('#snd'), soundLabel = $('#sndLabel');
soundBtn.addEventListener('click', async () => {
  const on = await sound.toggle();
  soundBtn.setAttribute('aria-pressed', String(on));
  soundLabel.textContent = on ? 'Son de cabine' : 'Son coupé';
});

/* ---------- Calm zone: the sky behind the section being read gets a little quieter ---------- */
function calmRect() {
  let best = null, bd = 1e9; const H = innerHeight, W = innerWidth;
  for (const s of sections) {
    const r = s.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - H / 2);
    if (d < bd) { bd = d; best = [s, r]; }
  }
  if (!best || best[0].dataset.calm !== '1') return [0, 0, 0, 0, 0];
  const r = best[1], cx = (r.left + r.right) / 2, half = Math.min(r.width / 2 - 20, W * .42);
  return [(cx - half) / W, 1 - (r.bottom - 8) / H, (cx + half) / W, 1 - (r.top + 8) / H, clamp(1 - (bd - H * .25) / (H * .3))];
}

/* ---------- Loop ---------- */
const t0 = performance.now();
let prev = t0, drift = 0, vY = scrollY;

function frame(now) {
  scroll.tick(now);
  const dt = Math.min(.05, (now - prev) / 1000); prev = now;
  /* without Lenis (touch screens), the scene follows the native scroll with a little smoothing */
  vY = scroll.smooth || reducedMotion ? scrollY : vY + (scrollY - vY) * .22;
  if (Math.abs(scrollY - vY) < .2) vY = scrollY;
  const y = vY, f = scroll.fOf(y);
  scroll.placeTexts(y);

  const S = sky(f), ft = altFt(f), hz = horizon(f), tl = tilt(f);
  const portrait = innerWidth < innerHeight * .9;
  const sun = sunPosition(f, hz, S.sunSize, portrait);
  const time = reducedMotion ? 40 : (now - t0) / 1000;
  if (!reducedMotion && f > .053 && f < .5) drift += dt * 70;
  if (f <= .053) drift = 0;
  nav.classList.toggle('solid', scrollY > 40);

  if (renderer) {
    renderer.draw((gl, U) => {
      const { gw, gh } = renderer.size;
      gl.uniform1f(U.uTime, time); gl.uniform3fv(U.uPal, S.pal.flat());
      gl.uniform1f(U.uSea, S.sea); gl.uniform1f(U.uFog, S.fog); gl.uniform1f(U.uCover, S.cover);
      gl.uniform1f(U.uTop, S.top); gl.uniform1f(U.uBot, S.bot); gl.uniform1f(U.uLo, S.lo); gl.uniform1f(U.uHi, S.hi);
      gl.uniform1f(U.uGlow, S.glow); gl.uniform1f(U.uRays, S.rays); gl.uniform1f(U.uStars, S.stars);
      gl.uniform1f(U.uOffY, (ft / 35000) * 7);
      gl.uniform1f(U.uFlash, f > .38 && f < .45 ? Math.sin((Math.PI * (f - .38)) / .07) * .1 : 0);   /* breaking through */
      gl.uniform3fv(U.uSun, sun); gl.uniform2fv(U.uWing, S.wing);
      gl.uniform1f(U.uGround, f < GROUND_END || f > NIGHT_START ? 1 : 0);
      gl.uniform1f(U.uH, Math.max(4, ft / 3.281)); gl.uniform1f(U.uTravel, travel(f, drift));
      gl.uniform1f(U.uTilt, (tl * Math.PI) / 180); gl.uniform1f(U.uHorizon, hz);
      gl.uniform1f(U.uNight, groundLights(f)); gl.uniform1f(U.uCity, f > CITY_START ? 1 : 0);
      gl.uniform1f(U.uStrobe, strobe(now, reducedMotion)); gl.uniform1f(U.uWingS, clamp(gw / gh / 1.4, .5, 1));
      gl.uniform1f(U.uBlink, now % 1500 < 700 ? 1 : 0);
      gl.uniform1f(U.uGlint, .12 + (hz - .30) * .5 + tl * .01 + Math.sin(time * .25) * .02);
      gl.uniform4fv(U.uRwy, RUNWAYS);
      const mo = moonPosition(f, hz); gl.uniform4fv(U.uMoon, mo[0]); gl.uniform3fv(U.uMoonL, mo[1]);
      gl.uniform1f(U.uMilky, f > .8 ? smooth(clamp((f - .86) / .05)) : 0);
      gl.uniform1f(U.uFlightX, f * 55);                                                 /* the decor moves with the scroll */
      gl.uniform1f(U.uFogDir, f < .3 ? 1 : f < .82 ? -1 : 1);
      const me = meteor(now, S.stars, gw / gh); gl.uniform4fv(U.uMet, me[0]); gl.uniform2fv(U.uMet2, me[1]);
      const c = calmRect(); gl.uniform4f(U.uCalm, c[0], c[1], c[2], c[3]); gl.uniform1f(U.uCalmK, c[4]);
    });
  } else {
    const a = S.pal[2].map((v) => Math.round(v * 255)), c = S.pal[5].map((v) => Math.round(v * 255));
    document.body.style.background = `linear-gradient(rgb(${a}), rgb(${c}))`;
  }
  updateAltimeter(ft);
  drawPictos(S.pal);
  document.body.classList.toggle('landed', f > .985);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* entry point for the verification scripts (tools/): jump to a point of the flight */
window.seat12a = { goTo: scroll.jump, fOf: scroll.fOf, sOf: scroll.sOf };
