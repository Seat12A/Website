/*
 * Arrival: the window blind. When the page opens, a pixel-art blind covers the whole view (and the texts), then it is
 * pulled up: it gives a little first (unlatched), then slides up and uncovers the runway. About 1.3 s.
 *
 * Drawn on its own small canvas above everything (one canvas pixel = one cell of the scene), with the tones of the
 * scene: slats with a groove and a highlight, a heavier bottom bar with a handle. No blur, no fade: the blind moves
 * cell by cell. Skipped when the visitor prefers reduced motion.
 *
 * Its clock advances frame by frame, at most 1/15 s per frame, and only from the third frame: the first frames can be
 * slow (the scene shader compiles), and the blind would otherwise jump to the end before anyone sees it.
 */
import { clamp, smooth } from './util.js';

const HOLD = .25, UNLATCH = .14, PAUSE = .1, RISE = .85;

export function createIntro(canvas, reducedMotion) {
  if (reducedMotion || !canvas) { canvas?.remove(); return () => false; }
  const ctx = canvas.getContext('2d');
  let frames = 0, t = 0, last = 0;

  /** Returns false once the blind is gone (the canvas is then removed). */
  return function draw(now, pal, cellCss) {
    if (++frames > 3) t += Math.min(1 / 15, (now - last) / 1000);
    last = now;
    const gw = Math.ceil(innerWidth / cellCss), gh = Math.ceil(innerHeight / cellCss);
    if (canvas.width !== gw || canvas.height !== gh) {
      canvas.width = gw; canvas.height = gh;
      canvas.style.width = gw * cellCss + 'px'; canvas.style.height = gh * cellCss + 'px';
    }
    /* how many rows the blind still covers, from the top */
    const give = 4, total = gh + 6;
    let cover = gh;
    if (t > HOLD) cover = gh - give * smooth(clamp((t - HOLD) / UNLATCH));
    const r0 = HOLD + UNLATCH + PAUSE;
    if (t > r0) { const k = clamp((t - r0) / RISE); cover = (gh - give) - (total - give) * k * k * (3 - 2 * k); }
    cover = Math.round(cover);
    if (cover <= -6) { canvas.remove(); return false; }

    const css = pal.map((c) => `rgb(${c.map((v) => Math.round(v * 255))})`);
    ctx.clearRect(0, 0, gw, gh);
    const handle = Math.min(18, Math.round(gw * .08)), hx = Math.round((gw - handle) / 2);
    for (let y = 0; y < Math.min(cover, gh); y++) {
      const j = cover - 1 - y;                                   /* rows counted from the bottom edge of the blind */
      let tone;
      if (j === 0) tone = 1;                                     /* bottom bar: shadow, face, highlight */
      else if (j < 3) tone = 3;
      else if (j === 3) tone = 4;
      else { const m = (j - 4) % 6; tone = m === 5 ? 1 : m === 4 ? 3 : 2; }      /* slats: groove, highlight, face */
      ctx.fillStyle = css[tone]; ctx.fillRect(0, y, gw, 1);
      if (j === 1 || j === 2) { ctx.fillStyle = css[j === 1 ? 0 : 1]; ctx.fillRect(hx, y, handle, 1); }  /* the handle */
    }
    return true;
  };
}
