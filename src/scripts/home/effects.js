/* Time-driven details: shooting stars and the wing-tip strobe. */
import { clamp } from './util.js';

/** Shooting stars: every 4 to 11 s when the sky is dark, ~0.9 s each. Returns [[x, y, dx, dy], [length, brightness]]. */
export function createMeteors(reducedMotion) {
  let met = null, next = performance.now() + 2200;
  const none = [[0, 0, 1, 0], [0, 0]];
  return function meteor(now, vis, asp) {
    if (reducedMotion || vis < .45) { met = null; return none; }
    if (!met && now > next) {
      const a = Math.PI + .3 + Math.random() * .35;
      met = { t0: now, x: (.3 + Math.random() * .6) * asp, y: .7 + Math.random() * .24, dx: Math.cos(a), dy: Math.sin(a), life: 750 + Math.random() * 350 };
    }
    if (!met) return none;
    const t = now - met.t0;
    if (t > met.life) { met = null; next = now + 4000 + Math.random() * 7000; return none; }
    const s = (t / 1000) * .8, k = t / met.life;
    return [[met.x + met.dx * s, met.y + met.dy * s, met.dx, met.dy], [.13 * Math.min(1, t / 220), Math.sin(Math.PI * k) * vis]];
  };
}

/** Strobe: two short flashes every 1.4 s, with very short rise and fall. */
export function strobe(now, reducedMotion) {
  if (reducedMotion) return 0;
  const ph = now % 1400, pulse = (t) => clamp(1 - Math.abs(ph - t) / 45);
  return Math.max(pulse(40), pulse(220));
}
