/*
 * The 404 illustration: an airliner that came down nose first beside the runway, tail in the air, on a small patch of
 * ground, alone in the middle of a plain night-blue page. Realistic rather than cartoonish (Jules, 25/11/2026).
 *
 * It is a tiny 3D render made into pixel art: the plane is a signed distance field (fuselage, nose, tail cone, swept
 * wings, engines, stabiliser, fin), ray-marched once per size at the resolution of the cells, lit by a low cold light
 * with soft shadows, then reduced to one ladder of 8 tones with ordered dithering between neighbouring tones only (as
 * the rules ask, docs/decisions.md). The one warm accent: the cabin windows, still lit. Rendered by rows over a few
 * frames so the page never freezes.
 */
import { oklch } from '../home/util.js';

/* the scene's ladder: cold blue-greys from just above the page background to near white */
const LADDER = [.24, .32, .41, .51, .61, .72, .84, .96].map((L, i) => oklch(L, [.05, .05, .045, .04, .032, .022, .014, .008][i], 262));
const INK = oklch(.13, .045, 265);                                   /* outline, a step below the page */
const WARM = [1, .74, .38];
const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

/* ---------- distance functions (plane frame: x forward, y up, z towards the right wing; metres) ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function box(qx, qy, qz, bx, by, bz) {
  const dx = Math.abs(qx) - bx, dy = Math.abs(qy) - by, dz = Math.abs(qz) - bz;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dy, dz), 0);
}
function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25; }

/* returns [distance, part]; parts: 1 fuselage, 2 wing, 3 engine, 4 tail surfaces */
function planeSdf(x, y, z) {
  /* fuselage: a cylinder, an elongated nose, a tail cone rising towards the fin */
  const cx = clamp(x, -12, 12);
  let fus = Math.hypot(x - cx, y, z) - 2;
  const nose = (Math.hypot((x - 12) / 4.4, y / 2, z / 2) - 1) * 1.9;
  const t = clamp((x + 12) / -7, 0, 1), tx = -12 - 7 * t, ty = .85 * t * t, tr = 2 - 1.65 * t;
  const tail = (Math.hypot(x - tx, y - ty, z) - tr) * .8;
  fus = smin(smin(fus, nose, 1.2), tail, 1.4);
  let d = fus, part = 1;
  /* wings: swept back, tapered, a little dihedral */
  const az = Math.abs(z);
  {
    const zz = Math.min(az, 17.5), c = 5.4 - 3.7 * zz / 17.5;
    const lx = x - 1.8 + .56 * zz, ly = y + .9 - .085 * zz;
    const w = box(lx + c / 2, ly, az - 8.75, c / 2, .17 - .08 * zz / 17.5, 8.75) * .7;
    if (w < d) { d = w; part = 2; }
  }
  /* engines under the wings */
  {
    const ex = clamp(x, -1, 2.6), ez = az - 5.7;
    const e = Math.hypot(x - ex, y + 1.85, ez) - .95;
    if (e < d) { d = e; part = 3; }
  }
  /* horizontal stabiliser */
  {
    const zz = Math.min(az, 6.2), c = 2.9 - 1.6 * zz / 6.2;
    const lx = x + 16.2 + .5 * zz, ly = y - .55 - .07 * zz;
    const h = box(lx + c / 2, ly, az - 3.1, c / 2, .1, 3.1) * .7;
    if (h < d) { d = h; part = 4; }
  }
  /* fin */
  {
    const yy = clamp(y - 1.1, 0, 6.6), c = 4.9 - 2.7 * yy / 6.6;
    const lx = x + 13.6 + .78 * yy;
    const f = box(lx + c / 2, y - 1.1 - 3.3, z, c / 2, 3.3, .13) * .7;
    if (f < d) { d = f; part = 4; }
  }
  return [d, part];
}

/* ---------- the scene: the plane pitched nose-down into a mound, a patch of ground ---------- */
const PITCH = -27 * Math.PI / 180, ROLL = 7 * Math.PI / 180;
const cp = Math.cos(PITCH), sp = Math.sin(PITCH), cr = Math.cos(ROLL), sr = Math.sin(ROLL);
/* local → world: roll about x, then pitch about z; the nose tip (16.4, 0, 0) ends up 1.5 m below the ground at the origin */
function toWorld(x, y, z) {
  const y1 = y * cr - z * sr, z1 = y * sr + z * cr;
  return [x * cp - y1 * sp, x * sp + y1 * cp, z1];
}
const NOSE = toWorld(16.4, 0, 0), OFF = [-NOSE[0], -1.5 - NOSE[1], -NOSE[2]];
function toLocal(wx, wy, wz) {
  const x = wx - OFF[0], y = wy - OFF[1], z = wz - OFF[2];
  const lx = x * cp + y * sp, y1 = -x * sp + y * cp;                 /* inverse pitch */
  return [lx, y1 * cr + z * sr, -y1 * sr + z * cr];                    /* inverse roll */
}
const GROUND_R = 13;                                                   /* radius of the patch of ground */
function ground(x, y, z) {
  const r2 = x * x + z * z;
  /* the crater's lip around the nose, and the earth pushed ahead of it */
  const rr = Math.sqrt(r2);
  const mound = 1.5 * Math.exp(-((rr - 2.6) ** 2) / 2.2) + .8 * Math.exp(-((x - 3) ** 2 + z * z) / 12);
  return y - mound - .06 * Math.sin(x * 1.7 + z * .4) * Math.sin(z * 1.3);
}
function scene(x, y, z) {
  const [lx, ly, lz] = toLocal(x, y, z);
  const [dp, part] = planeSdf(lx, ly, lz);
  const dg = ground(x, y, z) * .8;
  return dg < dp ? [dg, 0, lx, ly, lz] : [dp, part, lx, ly, lz];
}
function normal(x, y, z) {
  const e = .02;
  return norm([scene(x + e, y, z)[0] - scene(x - e, y, z)[0], scene(x, y + e, z)[0] - scene(x, y - e, z)[0], scene(x, y, z + e)[0] - scene(x, y, z - e)[0]]);
}
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const LIGHT = norm([.62, .74, -.26]);                                /* from above, ahead of the plane, a little on our side: its shadow lies on the ground */

function softShadow(px, py, pz) {
  let res = 1, t = .15;
  for (let i = 0; i < 40 && t < 40; i++) {
    const h = scene(px + LIGHT[0] * t, py + LIGHT[1] * t, pz + LIGHT[2] * t)[0];
    if (h < .002) return 0;
    res = Math.min(res, 6 * h / t);
    t += clamp(h, .05, 1.5);
  }
  return clamp(res, 0, 1);
}

/* surface colour (albedo) and emission, from the part and the point in the plane's frame */
function surface(part, lx, ly, lz, wx, wz) {
  if (part === 0) {
    const r = Math.hypot(wx, wz);
    const dirt = Math.exp(-(wx * wx + wz * wz) / 22);                  /* torn earth around the nose, darker */
    return { a: .34 - .16 * dirt + .05 * Math.sin(wx * 3.1) * Math.sin(wz * 2.7), fade: r };
  }
  if (part === 1) {
    if (lx > 12.6 && lx < 14.6 && ly > .55 && ly < 1.15) return { a: .1 };                       /* cockpit */
    if (lx > -10.6 && lx < 10.8 && ly > .45 && ly < .9 && ((lx + 10.6) / .92) % 1 < .45) return { a: .2, warm: 1 };   /* windows */
    if (ly > -.45 && ly < -.12 && lx > -14 && lx < 15) return { a: .45 };                       /* cheat line */
    return { a: .95 };
  }
  if (part === 2) return { a: .78 };
  if (part === 3) return { a: lx > 2.3 ? .25 : .7 };
  /* tail surfaces: the fin in a darker livery, with the Seat 12A window */
  if (ly > 1.2) {
    const fx = lx + 13.6 + .78 * (ly - 1.1);
    if (ly > 3.2 && ly < 5.4 && fx > -3.4 && fx < -1.8) return { a: ly > 4.3 ? .9 : .7 };
    return { a: .42 };
  }
  return { a: .8 };
}

export function createPlane(canvas) {
  const ctx = canvas.getContext('2d');
  let job = 0;

  /** Renders the plane `cols` cells wide; the height follows from the framing. */
  function render(cols, cellCss) {
    const id = ++job;
    /* camera: three-quarter view from the left side and a little in front, slightly above */
    const c0 = toWorld(-8, 2, 0), target = [c0[0] + OFF[0], c0[1] + OFF[1], c0[2] + OFF[2]];
    const az = 38 * Math.PI / 180, el = 12 * Math.PI / 180, dist = 80;
    const cam = [target[0] + Math.sin(az) * Math.cos(el) * dist, target[1] + Math.sin(el) * dist, target[2] - Math.cos(az) * Math.cos(el) * dist];
    const fw = norm([target[0] - cam[0], target[1] - cam[1], target[2] - cam[2]]);
    const right = norm([-fw[2], 0, fw[0]]), up = [right[1] * fw[2] - right[2] * fw[1], right[2] * fw[0] - right[0] * fw[2], right[0] * fw[1] - right[1] * fw[0]];
    /* framing: project the far points of the scene (fin, wing tips, tail, nose, rim of the ground) and fit them */
    const pts = [[-20, 8, 0], [-17.5, 4.5, 0], [-9, .8, 17.5], [-9, .8, -17.5], [-20.5, 1, 6.5], [-20.5, 1, -6.5], [-19, .85, 0], [16, 0, 0]]
      .map(([x, y, z]) => { const w = toWorld(x, y, z); return [w[0] + OFF[0], w[1] + OFF[1], w[2] + OFF[2]]; });
    for (let i = 0; i < 16; i++) { const a2 = i / 16 * Math.PI * 2; pts.push([Math.cos(a2) * (GROUND_R - 2), .4, Math.sin(a2) * (GROUND_R - 2)]); }
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const q of pts) {
      const rel = [q[0] - cam[0], q[1] - cam[1], q[2] - cam[2]], zf = dot(rel, fw);
      const u = dot(rel, right) / zf, v = dot(rel, up) / zf;
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v);
    }
    const mu = (u1 - u0) * .05, mv = (v1 - v0) * .06;
    u0 -= mu; u1 += mu; v0 -= mv; v1 += mv;
    const rows = Math.round(cols * (v1 - v0) / (u1 - u0));
    canvas.width = cols; canvas.height = rows;
    canvas.style.width = cols * cellCss + 'px'; canvas.style.height = rows * cellCss + 'px';
    const img = ctx.createImageData(cols, rows), d = img.data;
    const hit = new Uint8Array(cols * rows);

    let y = 0;
    function rowsStep() {
      if (id !== job) return;
      const end = Math.min(rows, y + 6);
      for (; y < end; y++) for (let x = 0; x < cols; x++) {
        const u = u0 + (x + .5) / cols * (u1 - u0), v = v1 - (y + .5) / rows * (v1 - v0);
        const dir = norm([fw[0] + right[0] * u + up[0] * v, fw[1] + right[1] * u + up[1] * v, fw[2] + right[2] * u + up[2] * v]);
        let t = 30, res = null;
        for (let i = 0; i < 160 && t < 160; i++) {
          const px = cam[0] + dir[0] * t, py = cam[1] + dir[1] * t, pz = cam[2] + dir[2] * t;
          const s = scene(px, py, pz);
          if (s[0] < .01 * (t / 50)) {
            if (s[1] === 0 && Math.hypot(px, pz) > GROUND_R) break;      /* beyond the patch: nothing */
            res = [px, py, pz, s]; break;
          }
          t += s[0];
        }
        const i4 = (y * cols + x) * 4;
        if (!res) { d[i4 + 3] = 0; continue; }
        const [px, py, pz, s] = res;
        const part = s[1], m = surface(part, s[2], s[3], s[4], px, pz);
        /* the patch of ground fades out at its edge, in an ordered dither (cells, never a blur) */
        if (part === 0 && (GROUND_R - m.fade) / 5 < (B4[y & 3][x & 3] + .5) / 16) { d[i4 + 3] = 0; continue; }
        hit[y * cols + x] = part === 0 ? 1 : 2;
        let c;
        if (m.warm) c = WARM;
        else {
          const n = normal(px, py, pz);
          const diff = Math.max(0, dot(n, LIGHT)) * softShadow(px + n[0] * .05, py + n[1] * .05, pz + n[2] * .05);
          const amb = .16 + .14 * (n[1] * .5 + .5);
          const h = norm([LIGHT[0] - dir[0], LIGHT[1] - dir[1], LIGHT[2] - dir[2]]);
          const spec = part === 0 ? 0 : .35 * Math.pow(Math.max(0, dot(n, h)), 28) * diff;
          const lum = clamp((amb + .95 * diff) * m.a + spec, 0, 1);
          const k = Math.pow(lum, .85) * 7.6;                          /* tone index, dithered between neighbours */
          const idx = clamp(Math.floor(k + (B4[y & 3][x & 3] + .5) / 16 - .5), 0, 7);
          c = LADDER[idx];
        }
        d[i4] = c[0] * 255; d[i4 + 1] = c[1] * 255; d[i4 + 2] = c[2] * 255; d[i4 + 3] = 255;
      }
      if (y < rows) { requestAnimationFrame(rowsStep); return; }
      /* a one-cell ink outline around the plane where it meets the page */
      for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) {
        if (hit[yy * cols + xx]) continue;
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => hit[(yy + b) * cols + xx + a] === 2 && xx + a >= 0 && xx + a < cols && yy + b >= 0 && yy + b < rows);
        if (!nb) continue;
        const i4 = (yy * cols + xx) * 4;
        d[i4] = INK[0] * 255; d[i4 + 1] = INK[1] * 255; d[i4 + 2] = INK[2] * 255; d[i4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      canvas.dataset.ready = '1';
    }
    rowsStep();
  }
  return { render };
}
