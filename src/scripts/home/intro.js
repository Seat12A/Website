/*
 * Arrival: the scene appears cell by cell, in an ordered dither (8×8 Bayer), opening from the middle of the screen
 * outwards, with a rim of lighter cells along the front. Abstract on purpose: no object (a blind looked like a garage
 * door). No blur, no fade: each cell is either covered or not. About 1.2 s. Skipped when the visitor prefers reduced
 * motion.
 *
 * Drawn on its own small canvas above everything (one canvas pixel = one cell of the scene), with the darkest tones of
 * the scene. Its clock advances frame by frame, at most 1/15 s per frame, and only from the third frame: the first
 * frames can be slow (the scene shader compiles), and the reveal would otherwise jump to the end before anyone sees it.
 */
const HOLD = .15, OPEN = 1.05, SPREAD = .65, RIM = .07;

/* 8×8 Bayer matrix, values 0..63 */
const B8 = (() => {
  const b = [[0, 2], [3, 1]];
  let m = b;
  for (let n = 2; n < 8; n *= 2) {
    const next = [];
    for (let y = 0; y < n * 2; y++) {
      next.push([]);
      for (let x = 0; x < n * 2; x++) next[y].push(4 * m[y % n][x % n] + b[Math.floor(y / n)][Math.floor(x / n)]);
    }
    m = next;
  }
  return m;
})();

export function createIntro(canvas, reducedMotion) {
  if (reducedMotion || !canvas) { canvas?.remove(); return () => false; }
  const ctx = canvas.getContext('2d');
  let frames = 0, t = 0, last = 0, img = null;

  /** Returns false once the scene is fully revealed (the canvas is then removed). */
  return function draw(now, pal, cellCss) {
    if (++frames > 3) t += Math.min(1 / 15, (now - last) / 1000);
    last = now;
    const gw = Math.ceil(innerWidth / cellCss), gh = Math.ceil(innerHeight / cellCss);
    if (canvas.width !== gw || canvas.height !== gh || !img) {
      canvas.width = gw; canvas.height = gh;
      canvas.style.width = gw * cellCss + 'px'; canvas.style.height = gh * cellCss + 'px';
      img = ctx.createImageData(gw, gh);
    }
    const x = Math.min(1, Math.max(0, (t - HOLD) / OPEN)), k = x * x * (3 - 2 * x);
    if (k >= 1) { canvas.remove(); return false; }

    const dark = pal[0].map((v) => Math.round(v * 255)), rim = pal[2].map((v) => Math.round(v * 255));
    const cx = gw / 2, cy = gh / 2, R = Math.hypot(cx, cy), d8 = img.data;
    for (let y = 0; y < gh; y++) {
      for (let x2 = 0; x2 < gw; x2++) {
        const d = Math.hypot(x2 - cx, (y - cy) * 1.15) / R;                 /* 0 in the middle, ~1 in the corners */
        const v = k * (1 + SPREAD) - d * SPREAD, th = (B8[y & 7][x2 & 7] + .5) / 64;
        const i = (y * gw + x2) * 4;
        if (th < v) { d8[i + 3] = 0; continue; }                          /* revealed */
        const c = th < v + RIM ? rim : dark;                              /* the rim of the opening, then the dark */
        d8[i] = c[0]; d8[i + 1] = c[1]; d8[i + 2] = c[2]; d8[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return true;
  };
}
