/*
 * The flight plan: everything the scene shows is a function of f, the progress of the flight (0 = on the ground at
 * blue hour, 1 = parked in Paris at night), plus time for small motions.
 *
 * Scenes never change in plain sight: we enter a cloud (fog rises), the decor changes while we are inside, then we
 * come out. `sea` never moves while visible; it only changes when fog = 1.
 *
 * Steps: 0 on the ground · ~0.05 rotation · 0.05–0.17 climb · 0.165–0.215 entering the cloud · ~0.34 scene change inside
 * the cloud · 0.372–0.44 breaking through · 0.44–0.77 cruise, then golden hour · 0.772–0.80 descent into the cloud ·
 * 0.81–0.87 out under the clouds, night, Paris · 0.955 touchdown · 1 stop.
 */
import { PALETTES } from './palettes.js';
import { clamp, curve, mixV, smooth } from './util.js';

/** Below this, the ground phase is drawn (ground, cloud layer above, airport); above it, the sea-of-clouds phase. */
export const GROUND_END = 0.215;
/** From here on, the ground phase again (night, Paris). */
export const NIGHT_START = 0.81;
/** Paris and the village lights exist after this point. */
export const CITY_START = 0.5;

/* Key frames, smoothly interpolated by sky(f).
   pal: palette · sea: top of the sea of clouds (screen height) · fog: 0..1 inside the cloud · cover: high veils ·
   top/bot: sky tones at the top / at the horizon · lo/hi: cloud tones · sunSize: radius of the disk (0 = no disk) ·
   glow, rays: sun halo and rays · stars · wing: tone range of the wing. */
const KEYS = [
  { f: 0.000, pal: 'DAWN',      sea: -.4, fog: 0,   cover: .10, top: .03, bot: .92, lo: .45, hi: .80, sunSize: .04,  glow: .55, rays: .22, stars: .7,  wing: [.10, .62] },
  { f: 0.070, pal: 'DAWN',      sea: -.4, fog: 0,   cover: .12, top: .06, bot: .93, lo: .45, hi: .82, sunSize: .04,  glow: .62, rays: .30, stars: .25, wing: [.12, .68] },
  { f: 0.115, pal: 'SUNRISE',   sea: -.4, fog: 0,   cover: .16, top: .12, bot: .92, lo: .50, hi: .92, sunSize: .04,  glow: .72, rays: .70, stars: 0,   wing: [.16, .80] },
  { f: 0.140, pal: 'SUNRISE',   sea: -.4, fog: 0,   cover: .20, top: .20, bot: .90, lo: .50, hi: .92, sunSize: .04,  glow: .55, rays: .45, stars: 0,   wing: [.18, .82] },
  { f: 0.165, pal: 'SUNRISE',   sea: -.4, fog: .3,  cover: .20, top: .22, bot: .89, lo: .55, hi: .92, sunSize: .04,  glow: .45, rays: .3,  stars: 0,   wing: [.22, .84] },
  { f: 0.192, pal: 'SUNRISE',   sea: -.4, fog: .62, cover: .20, top: .26, bot: .88, lo: .55, hi: .92, sunSize: .04,  glow: .25, rays: .1,  stars: 0,   wing: [.26, .86] },
  { f: 0.215, pal: 'CLOUDDAWN', sea: -.4, fog: 1,   cover: .20, top: .70, bot: .80, lo: .55, hi: .90, sunSize: 0,    glow: 0,   rays: 0,   stars: 0,   wing: [.30, .88] },
  { f: 0.330, pal: 'CLOUD',     sea: -.4, fog: 1,   cover: .14, top: .75, bot: .80, lo: .60, hi: .95, sunSize: .05,  glow: 0,   rays: 0,   stars: 0,   wing: [.32, .92] },
  { f: 0.340, pal: 'CLOUD',     sea: .22, fog: 1,   cover: .14, top: .75, bot: .80, lo: .60, hi: .95, sunSize: .05,  glow: 0,   rays: 0,   stars: 0,   wing: [.32, .92] },
  { f: 0.372, pal: 'CLOUD',     sea: .22, fog: 1,   cover: .14, top: .40, bot: .70, lo: .60, hi: 1.0, sunSize: .05,  glow: .2,  rays: .2,  stars: 0,   wing: [.32, .95] },
  { f: 0.440, pal: 'CRUISE',    sea: .22, fog: 0,   cover: .14, top: .04, bot: .55, lo: .60, hi: 1.05, sunSize: .05, glow: .45, rays: .6,  stars: 0,   wing: [.32, .98] },
  { f: 0.680, pal: 'CRUISE',    sea: .22, fog: 0,   cover: .12, top: .06, bot: .58, lo: .60, hi: 1.05, sunSize: .05, glow: .40, rays: .35, stars: 0,   wing: [.30, .96] },
  { f: 0.750, pal: 'GOLD',      sea: .22, fog: 0,   cover: .18, top: .08, bot: .82, lo: .40, hi: 1.0, sunSize: .065, glow: .6,  rays: .8,  stars: 0,   wing: [.20, .92] },
  { f: 0.772, pal: 'GOLD',      sea: .22, fog: 0,   cover: .18, top: .08, bot: .82, lo: .40, hi: 1.0, sunSize: .065, glow: .6,  rays: .8,  stars: 0,   wing: [.20, .92] },
  { f: 0.798, pal: 'DUSK',      sea: .22, fog: 1,   cover: .18, top: .30, bot: .60, lo: .40, hi: .80, sunSize: 0,    glow: 0,   rays: 0,   stars: 0,   wing: [.12, .62] },
  { f: 0.812, pal: 'NIGHT',     sea: -.4, fog: 1,   cover: .06, top: .10, bot: .34, lo: .30, hi: .52, sunSize: 0,    glow: 0,   rays: 0,   stars: 0,   wing: [.05, .45] },
  { f: 0.835, pal: 'NIGHT',     sea: -.4, fog: 1,   cover: .06, top: .10, bot: .34, lo: .14, hi: .40, sunSize: 0,    glow: 0,   rays: 0,   stars: 0,   wing: [.05, .45] },
  { f: 0.868, pal: 'NIGHT',     sea: -.4, fog: 0,   cover: .06, top: .10, bot: .34, lo: .14, hi: .40, sunSize: 0,    glow: 0,   rays: 0,   stars: 0,   wing: [.05, .45] },
  { f: 1.000, pal: 'NIGHT',     sea: -.4, fog: 0,   cover: .06, top: .10, bot: .34, lo: .14, hi: .40, sunSize: 0,    glow: 0,   rays: 0,   stars: 0,   wing: [.05, .45] },
];

export function sky(f) {
  let i = 0;
  while (i < KEYS.length - 2 && f > KEYS[i + 1].f) i++;
  const a = KEYS[i], b = KEYS[i + 1], t = smooth(clamp((f - a.f) / (b.f - a.f))), o = {};
  for (const k in a) if (k !== 'f') o[k] = k === 'pal' ? mixV(PALETTES[a.pal], PALETTES[b.pal], t) : mixV(a[k], b[k], t);
  return o;
}

/** Altitude in feet. */
export const altFt = curve([[0, 13], [.05, 13], [.08, 520], [.115, 2400], [.16, 4800], [.36, 18000], [.44, 35000], [.68, 35000],
  [.78, 15000], [.82, 5000], [.86, 2200], [.955, 13], [1, 13]]);
/** Pitch, in degrees: seen from the left window, pitching up tilts the horizon (the nose, on the right, goes down). */
export const tilt = curve([[0, 0], [.043, 0], [.053, 9], [.10, 8], [.14, 4], [.18, 0], [.93, 0], [.948, 4], [.957, 0], [1, 0]]);
/** Height of the horizon on screen: the left turn while climbing lowers the wing, we see the ground from above. */
export const horizon = curve([[0, .30], [.06, .31], [.09, .66], [.13, .74], [.17, .62], [.20, .5], [.83, .5], [.86, .72], [.9, .66],
  [.935, .5], [.955, .40], [1, .40]]);
/** How lit the ground is (runway, taxiway, roads): 1 at night. */
export const groundLights = curve([[0, 1], [.07, 1], [.13, .25], [.17, 0], [.80, 0], [.83, 1], [1, 1]]);
/** Runways (x ranges, metres): departure and arrival. */
export const RUNWAYS = [-400, 3200, 98200, 101800];

/* ---------- Phenomena that illustrate the texts (0 = absent, 1 = full) ----------
   Real things one can see from a window seat, drawn as an atmosphere rather than as precise shapes. */
/** 22° halo and sun dogs (parhelia), when breaking through the clouds with the sun low: one sun, three images. */
export const halo = curve([[.43, 0], [.455, 1], [.53, 1], [.6, 0]]);
/** Another airliner crossing far above, at golden hour: its contrail widens and spreads as it ages.
 *  Returns [progress of the crossing 0..1, visibility]. Gone before we descend into the clouds (0.772). */
export function contrail(f) {
  const k = clamp((f - .63) / .14);
  return [k, smooth(clamp((f - .63) / .03)) * (1 - smooth(clamp((f - .735) / .03)))];
}
/** Over Paris at night: light runs along the streets, spreading out from the centre (the internet, made visible). */
export const network = curve([[.845, 0], [.9, 1], [1, 1]]);
/** The Eiffel Tower beacon turns with the scroll (radians), about one turn over the night arrival; parked, it points
 *  to the right and a little towards us, so it rises across the sky above the terminal. */
export const beacon = (f) => -.3 + (f - 1) * 30;

/** Distance travelled over the ground, in metres. `drift` is the extra distance flown with time while climbing. */
export function travel(f, drift) {
  if (f < .02) return 0;
  if (f < .053) { const s = (f - .02) / .033; return 1900 * s * s; }
  /* time-driven drift (the ground keeps moving in flight) settles in gently after take-off: no jump */
  if (f < .5) return 1900 + (f - .053) * 90000 + 2500 * (1 - Math.exp(-drift / 2500)) * smooth(clamp((f - .053) / .04));
  if (f < .955) { const s = clamp((f - .84) / .115); return 96000 + s * 2800; }
  /* we stop facing the tower and the terminal */
  const s = clamp((f - .955) / .045); return 98800 + 1750 * (1 - (1 - s) * (1 - s));
}

/* ---------- Sun and moon ----------
   One sun, one day. Its position is never set directly on screen: it has an elevation above the horizon that changes
   continuously with f, and the horizon it is measured from is the one we see (the ground horizon, which moves with the
   turn, or the top of the sea of clouds in cruise). So when the horizon moves, the sun moves with it, and when we come
   out of a cloud, the sun is where it was: just above the horizon.

   The day: the sun rises while we climb (it appears because we go up), is still low when we break through the
   clouds, climbs during the cruise, goes down at golden hour and sets into the sea of clouds as we descend into it.
   Night has no moon: the waning crescent seen at dawn sits close to the sun and sets before it. That is also why the
   Milky Way is so visible on arrival. */

/** Where the top of the sea of clouds reads as the horizon in cruise (sea = .22, plus the relief of its tops). */
const SEA_HORIZON = .24;
const sunX = curve([[0, .82], [.44, .83], [.6, .79], [.8, .81]]);
/** Elevation above the horizon, in screen heights. */
const sunElevation = curve([[0, -.07], [.06, -.05], [.12, .035], [.2, .05], [.44, .09], [.6, .46], [.772, .06], [.8, -.06]]);
/* On a portrait screen the texts take the whole width: the sun stays above them while one is being read, and rises or
   sets only between two texts (0.478–0.512: nothing in the middle of the screen; 0.748–0.775: the last text has left). */
const sunElevationPortrait = curve([[0, -.07], [.06, -.05], [.12, .035], [.2, .05], [.44, .09], [.478, .09], [.512, .64],
  [.748, .64], [.775, .06], [.8, -.06]]);

/** Sun as [x, y, radius] in screen units (x and y in 0..1, y from the bottom). */
export function sunPosition(f, hz, size, portrait) {
  const el = (portrait ? sunElevationPortrait : sunElevation)(f);
  const ref = f < GROUND_END || f > NIGHT_START ? hz : SEA_HORIZON;
  return [sunX(f), ref + el, portrait && f >= GROUND_END ? size * .8 : size];
}

/** Moon as [[x, y, radius, visibility], lightDirection]. A thin waning crescent before dawn, lit from the side of the
 *  sun that is about to rise (to the right, below the horizon); it fades as the sky brightens. */
export function moonPosition(f, hz) {
  if (f < .2) return [[.13, hz + .44, .03, 1 - smooth(clamp((f - .05) / .09))], [.92, -.25, -.5]];
  return [[0, 0, .03, 0], [1, 0, 0]];
}
