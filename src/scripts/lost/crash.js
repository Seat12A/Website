/*
 * The 404 illustration: a little airliner that missed its gate, nose planted in the grass beside the runway, tail in
 * the air, a few puffs of smoke rising from its engine. Cute rather than dramatic: a plump fuselage, a round nose, its
 * cabin windows still lit, the Seat 12A window on its fin.
 *
 * Pixel art on the scene's own grid (one canvas pixel = one cell, same size as the shader's cells, anchored top left
 * like the scene), drawn only with the scene's tone ladder plus the one warm accent (lit windows), as the rules ask
 * (docs/decisions.md). The plane is computed once per resize, in its own frame (x from the nose to the tail, y up),
 * rotated nose-down, then outlined; only the smoke moves, in steps (8 per second), and not at all with reduced motion.
 */
const WARM = [1, .74, .38];                                            /* the shader's warm window light */

/* Shapes of the plane, in its own frame, for a fuselage 58 units long and 22 high (plump on purpose). Returns a
   material, or null. Order matters: the near wing and the engine are in front of the fuselage. */
const R = 11;
function poly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const ell = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

function material(x, y) {
  /* engine (under the near wing): intake, nacelle */
  if (ell(x, y, 20, -R - 3.2, 1.6, 3.1)) return { g: 'engine', t: 1 };
  if (ell(x, y, 25, -R - 3.2, 6, 3.9)) return { g: 'engine', t: y > -R - 2.4 ? 5 : 4 };
  /* near wing, a short swept stub */
  if (poly(x, y, [[22, -3], [34, -3], [39, -R - 8], [33, -R - 8]])) return { g: 'wing', t: y > -6 ? 5 : 4 };
  /* horizontal stabiliser */
  if (poly(x, y, [[46, 0], [54, 0], [58, 3.2], [51, 3.2]])) return { g: 'stab', t: 3 };
  /* the Seat 12A window on the fin: frame, sky, a small sun */
  const lx = 51, ly = R + 6.5;
  if (Math.abs(x - lx) <= 2.6 && Math.abs(y - ly) <= 3.4) {
    if (Math.abs(x - lx) > 1.5 || Math.abs(y - ly) > 2.3) return { g: 'logo', t: 1 };
    if (ell(x, y, lx - .5, ly + 1, 1, 1)) return { g: 'logo', t: 6 };
    return { g: 'logo', t: y > ly - .4 ? 4 : 5 };
  }
  /* fin */
  if (poly(x, y, [[39, R - 2], [50, R - 2], [57, R + 14], [51, R + 14]])) return { g: 'fin', t: x < 42.5 + (y - R) * .45 ? 4 : 3 };
  /* fuselage: round nose, cylinder, tail cone rising to the fin */
  let inBody = false;
  if (x >= 0 && x < R) inBody = ell(x, y, R, 0, R, R);
  else if (x >= R && x <= 40) inBody = Math.abs(y) <= R;
  else if (x > 40 && x <= 56) { const t = (x - 40) / 16; inBody = y <= R - t * 3 && y >= -R + t * R * 1.5; }
  if (!inBody) return null;
  /* cockpit windows (with a glint), cabin windows (lit), cheat line */
  if (y >= 2.5 && y <= 6 && x >= 3.6 + (y - 2.5) * .55 && x <= 9.5) return { g: 'body', t: (x < 6 && y > 4.8) ? 5 : 1 };
  for (let wx = 15; wx <= 38; wx += 4.6) if (ell(x, y, wx, 3.6, 1.5, 1.6)) return { g: 'body', t: 'warm' };
  if (y >= -2.2 && y <= -.8 && x > 2.5) return { g: 'body', t: 3 };
  return { g: 'body', t: y > R * .4 ? 6 : y < -R * .42 ? 4 : 5 };
}

export function createCrash(canvas, reducedMotion) {
  const ctx = canvas.getContext('2d');
  let gw = 1, gh = 1, img = null, plane = null, lastStep = -1, lastPal = null;

  function resize(cellCss) {
    gw = Math.ceil(innerWidth / cellCss); gh = Math.ceil(innerHeight / cellCss);
    canvas.width = gw; canvas.height = gh;
    canvas.style.width = gw * cellCss + 'px'; canvas.style.height = gh * cellCss + 'px';
    img = ctx.createImageData(gw, gh);
    plane = null; lastStep = -1;
  }

  /* The plane as a list of cells [x, y, tone], computed once per size. `hz`: horizon height on screen (0..1). */
  function build(hz) {
    const k = Math.min(Math.max(gw * .27, 66), 124) / 58;              /* size: about a quarter of the width, never tiny */
    const th = 32 * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
    const groundY = Math.round(gh * (1 - hz) + gh * hz * .64);
    const nx = Math.round(gw * .5 - 26 * k * cs), ny = groundY + Math.round(2.5 * k);
    /* screen cell → plane frame: x along the fuselage (towards the tail, up and right), y across (up) */
    const toLocal = (sx, sy) => { const dx = (sx - nx) / k, dy = (sy - ny) / k; return [dx * cs - dy * sn, -dx * sn - dy * cs]; };
    const x0 = nx - 8 * k, x1 = nx + 66 * k, y0 = ny - 62 * k, y1 = ny + 24 * k;
    const grid = new Map();
    for (let sy = Math.floor(y0); sy <= y1; sy++) for (let sx = Math.floor(x0); sx <= x1; sx++) {
      const [lx, ly] = toLocal(sx + .5, sy + .5);
      const m = material(lx, ly);
      if (m) grid.set(sx + ',' + sy, m);
    }
    const cells = [];
    /* shadow on the grass, under the plane */
    const shx = nx + 24 * k * cs, shy = groundY + 2 * k;
    for (let sy = Math.floor(shy - 3 * k); sy <= shy + 3 * k; sy++) for (let sx = Math.floor(shx - 24 * k); sx <= shx + 24 * k; sx++) {
      if (ell(sx, sy, shx, shy, 21 * k, 2.2 * k)) cells.push([sx, sy, 0]);
    }
    /* the plane, outlined: the outer edge in the darkest ink, the edges of the wing and engine a step lighter */
    for (const [key, m] of grid) {
      const [sx, sy] = key.split(',').map(Number);
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => grid.get(sx + a + ',' + (sy + b)));
      let t = m.t;
      if (n.some((o) => !o)) t = 1;
      else if (m.g !== 'body' && m.g !== 'logo' && n.some((o) => o.g !== m.g && o.g === 'body')) t = 2;
      cells.push([sx, sy, t]);
    }
    /* the mound of earth the nose went into, with a lighter rim and a few clods */
    const mx = nx + 2 * k, mh = 4.6 * k;
    for (let sy = Math.floor(groundY - mh); sy <= groundY + 2 * k; sy++) for (let sx = Math.floor(mx - 13 * k); sx <= mx + 13 * k; sx++) {
      if (!ell(sx, sy, mx, groundY + k, 12 * k, mh + k)) continue;
      const rim = !ell(sx, sy - 1, mx, groundY + k, 12 * k, mh + k);
      cells.push([sx, sy, rim ? 3 : 2]);
    }
    for (const [dx, dy] of [[-15, -1], [-18, 1], [15, -2], [17, 0], [-14, -4]]) cells.push([Math.round(mx + dx * k), Math.round(groundY + dy * k), 3]);
    /* where the smoke comes from: just above the cabin, behind the wing */
    const [ex, ey] = [nx + (24 * cs - (R + 2) * sn) * k, ny + (-24 * sn - (R + 2) * cs) * k];
    return { cells, k, ex, ey };
  }

  function rgb(pal, t) { const c = t === 'warm' ? WARM : pal[t]; return [c[0] * 255, c[1] * 255, c[2] * 255]; }

  function draw(now, pal, hz) {
    if (!img) return;
    if (!plane || pal !== lastPal) { plane = build(hz); lastPal = pal; lastStep = -1; }
    const step = reducedMotion ? 0 : Math.floor(now / 125);
    if (step === lastStep) return;
    lastStep = step;
    const d = img.data; d.fill(0);
    const put = (x, y, t) => {
      if (x < 0 || y < 0 || x >= gw || y >= gh) return;
      const i = (y * gw + x) * 4, [r, g, b] = rgb(pal, t);
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    };
    for (const [x, y, t] of plane.cells) put(x, y, t);
    /* smoke: three round puffs rising from the cabin roof, swelling then shrinking away as the wind takes them left
       (solid cells, no dithering against the sky: that would make a grid of little squares) */
    const { k, ex, ey } = plane, time = step * 125;
    for (let i = 0; i < 3; i++) {
      const p = reducedMotion ? [.2, .5, .8][i] : ((time / 3600 + i / 3) % 1);
      const cx = ex - (p * 16 + Math.sin(p * 5 + i * 2) * 1.5) * k, cy = ey - (2 + p * 26) * k;
      const r = (1.4 + 4.2 * Math.sin(Math.PI * Math.min(1, p * 1.15)) ** .8) * k;
      if (r < .8) continue;
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if (Math.hypot(x + .5 - cx, y + .5 - cy) > r) continue;
        put(x, y, (x + .5 - cx) + (y + .5 - cy) < -r * .4 ? 5 : 4);
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  return { resize, draw };
}
