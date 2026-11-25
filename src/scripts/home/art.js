/*
 * Pixel-art illustrations next to the texts. Each one is a small canvas (one canvas pixel = one cell of the scene,
 * see --cell in home.css), redrawn with the 8 tones of the current scene, like the pictograms.
 *
 * They are driven by the scroll, not by time: `p` goes from 0 (the section enters the screen) to 1 (the section is
 * where it is read). Scrolling back plays them backwards. Only the radar also uses time (its sweep turns).
 * No real post, no real claim: text is drawn as bars, and nothing imitates the look of X.
 *
 *   feed     a post that spreads: copies appear around it, wave after wave            (section "on y voit mal")
 *   context  a post, one sentence underlined, and a context note that unfolds below    (section "vérifier…")
 *   radar    a radar screen; more echoes appear as you scroll (data piling up)          (section "les études")
 *   browser  a browser window with three posts; the extension marks two of them        (section "un doute ?")
 *   belt     the seat-belt sign; it switches off when the plane is parked              (arrival)
 */
import { clamp } from './util.js';

/** The warm light, the one colour outside the ladder (see docs/decisions.md). */
const WARM = 'rgb(255,189,97)';

/* Tones used by each part, on a dark sky and on a bright one (sections with .light, in the cloud). */
const SCHEMES = {
  dark:  { face: 1, face2: 2, line: 4, line2: 6, soft: 3, text: 4, mid: 6, hi: 7, back: 0 },
  light: { face: 7, face2: 6, line: 2, line2: 1, soft: 4, text: 3, mid: 1, hi: 0, back: 5 },
};

function painter(ctx, pal, scheme) {
  const css = pal.map((c) => `rgb(${c.map((v) => Math.round(v * 255))})`);
  const col = (t) => (t in scheme ? css[scheme[t]] : typeof t === 'string' ? t : css[clamp(t, 0, 7)]);
  const fill = (x, y, w, h, t) => { if (w <= 0 || h <= 0) return; ctx.fillStyle = col(t); ctx.fillRect(x, y, w, h); };
  /** A box with cut corners (a pixel rounded rectangle). */
  const box = (x, y, w, h, line, face) => {
    if (face != null) fill(x + 1, y + 1, w - 2, h - 2, face);
    fill(x + 1, y, w - 2, 1, line); fill(x + 1, y + h - 1, w - 2, 1, line);
    fill(x, y + 1, 1, h - 2, line); fill(x + w - 1, y + 1, 1, h - 2, line);
  };
  /** A dotted horizontal line. */
  const dots = (x, y, w, t) => { for (let i = 0; i < w; i += 2) fill(x + i, y, 1, 1, t); };
  /** A small sprite from strings: each character is a tone name in `keys`, '.' is empty. */
  const sprite = (x, y, rows, keys) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (keys[ch] != null) fill(x + i, y + j, 1, 1, keys[ch]); }));
  return { fill, box, dots, sprite };
}

const HEART = ['1.1', '111', '.1.'];
const REPOST = ['.1...', '111.1', '.1..1', '1..1.', '1.111', '...1.'];
/** The Seat 12A window (the logo, simplified). */
const WINDOW = ['.111.', '12221', '12321', '12221', '12221', '.111.'];
const CURSOR = ['1....', '11...', '121..', '1221.', '12221', '1211.', '.1.1.'];
const BELT = ['....11....', '....11....', '..111111..', '.1.1111.1.', '.1.1111.1.', '.22233222.', '...1111...', '...1..1...', '...1..1...', '..11..11..'];

/* ---------- feed: a post that spreads ---------- */
const FEED_CELLS = (() => {
  const cells = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
    if (c >= 2 && c <= 3 && r >= 1 && r <= 3) continue;                       /* the big card sits there */
    const jitter = ((c * 7 + r * 13) % 5) / 5;
    cells.push({ c, r, k: Math.abs(c - 2.5) + Math.abs(r - 2) * .8 + jitter * .5 });
  }
  const max = Math.max(...cells.map((x) => x.k));
  cells.forEach((x) => { x.k /= max; });
  return cells;
})();

function feed(P, p) {
  /* the copies, wave after wave: first an outline (it pops), then the card */
  FEED_CELLS.forEach(({ c, r, k }) => {
    const a = (p - .08 - k * .72) / .07;
    if (a < 0) return;
    const x = c * 14, y = r * 11;
    if (a < 1) { P.box(x + 1, y + 1, 12, 9, 'hi'); return; }
    P.box(x + 1, y + 1, 12, 9, 'line', 'face');
    P.fill(x + 3, y + 3, 2, 2, 'soft'); P.fill(x + 6, y + 3, 5, 1, 'text'); P.fill(x + 3, y + 6, 8, 1, 'text');
  });
  /* the original post */
  P.box(29, 12, 26, 31, 'line2', 'face2');
  P.fill(32, 15, 4, 4, 'soft'); P.fill(38, 15, 10, 1, 'hi'); P.fill(38, 17, 7, 1, 'text');
  P.fill(32, 22, 20, 1, 'text'); P.fill(32, 25, 18, 1, 'text'); P.fill(32, 28, 13, 1, 'text');
  P.fill(32, 31, 20, 5, 'soft');
  P.sprite(32, 37, REPOST, { 1: 'mid' }); P.sprite(40, 38, HEART, { 1: 'mid' });
  P.fill(45, 39, Math.round(7 * clamp(p * 1.1)), 1, 'hi');                     /* the counter keeps growing */
}

/* ---------- context: a sentence underlined, a note unfolds ---------- */
function context(P, p) {
  P.box(6, 2, 64, 28, 'line', 'face');
  P.fill(10, 6, 4, 4, 'soft'); P.fill(17, 6, 14, 1, 'mid'); P.fill(17, 8, 9, 1, 'text');
  P.fill(10, 14, 54, 1, 'text'); P.fill(10, 20, 52, 1, 'text'); P.fill(10, 23, 30, 1, 'text');
  const u = Math.round(48 * clamp((p - .12) / .2));                            /* the claim gets underlined */
  P.fill(10, 17, 48, 1, 'text'); P.fill(10, 17, u, 1, 'hi'); P.fill(10, 18, u, 1, 'soft');
  if (p > .34) P.fill(12, 30, 1, 1, 'mid');
  if (p > .37) P.fill(12, 32, 1, 1, 'mid');
  const h = Math.round(26 * clamp((p - .4) / .3) / 2) * 2;                     /* the note unfolds, two cells at a time */
  if (h >= 3) P.box(6, 34, 64, h, 'line2', 'face2');
  if (h >= 26) {
    P.sprite(11, 39, WINDOW, { 1: 'hi', 2: 'soft', 3: 'mid' });
    P.fill(19, 39, 20, 1, 'hi');
    const n = Math.round(4 * clamp((p - .72) / .22));
    [[19, 43, 44], [19, 46, 40], [19, 49, 42]].slice(0, n).forEach(([x, y, w]) => P.fill(x, y, w, 1, 'text'));
    if (n > 3) P.dots(19, 53, 17, 'mid');                                     /* the source, a link */
  }
}

/* ---------- radar: echoes pile up ---------- */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const ECHOES = [[.35, .6], [.62, 1.9], [.8, 2.7], [.5, 3.6], [.27, 4.4], [.72, 4.9], [.55, 5.7], [.9, .3], [.42, 2.3], [.66, 3.2], [.85, 5.3], [.2, 1.2]];
function radar(P, p, time) {
  const cx = 31.5, cy = 31.5, R = 30, sweep = (time * 1.1) % (Math.PI * 2);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (d > R + .5) continue;
    if (d > R - .5) { P.fill(x, y, 1, 1, 'line'); continue; }
    let behind = sweep - Math.atan2(dy, dx); behind = ((behind % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const ring = (Math.abs(d - 10) < .5 || Math.abs(d - 20) < .5) && (x + y) % 2 === 0;
    const cross = (x === 31 || y === 31) && (x + y) % 2 === 0;
    let t = ring || cross ? 'face2' : 'face';
    if (behind < .07) t = 'mid';
    else if (behind < .7 && BAYER[(y % 4) * 4 + (x % 4)] / 16 < (1 - behind / .7) * .8) t = 'soft';
    P.fill(x, y, 1, 1, t);
  }
  const n = Math.ceil(clamp(p) * ECHOES.length);
  ECHOES.slice(0, n).forEach(([r, a]) => {
    const x = Math.round(cx + Math.cos(a) * r * (R - 3)), y = Math.round(cy + Math.sin(a) * r * (R - 3));
    let since = sweep - a; since = ((since % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const t = since < .5 ? 'hi' : since < 2 ? 'mid' : 'line';
    P.fill(x, y, 2, 2, t);
  });
}

/* ---------- browser: the extension marks posts ---------- */
function browser(P, p) {
  P.box(1, 1, 82, 56, 'line', 'face');
  P.fill(2, 2, 80, 6, 'face2'); P.fill(2, 8, 80, 1, 'line');
  [5, 9, 13].forEach((x) => P.fill(x, 4, 2, 2, 'soft'));
  P.fill(20, 4, 46, 2, 'face');
  const posts = [11, 26, 41];
  posts.forEach((y) => {
    P.box(8, y, 68, 13, 'soft', 'face');
    P.fill(11, y + 3, 3, 3, 'soft'); P.fill(16, y + 3, 12, 1, 'mid');
    P.fill(16, y + 6, 46, 1, 'text'); P.fill(16, y + 9, 36, 1, 'text');
  });
  const mark = (y) => { P.box(65, y + 2, 9, 9, 'hi', 'face2'); P.sprite(67, y + 3, WINDOW, { 1: 'hi', 2: 'soft', 3: 'mid' }); };
  if (p > .45) mark(posts[0]);
  if (p > .75) mark(posts[2]);
  /* the cursor goes to the first mark */
  const k = clamp((p - .2) / .55), x = Math.round(80 - k * 9), y = Math.round(54 - k * 37);
  P.sprite(x, y, CURSOR, { 1: 'hi', 2: 'face' });
}

/* ---------- belt: the seat-belt sign ---------- */
function belt(P, p, time, lit) {
  P.box(0, 0, 18, 14, 'line', 'back');
  P.sprite(4, 2, BELT, lit ? { 1: WARM, 2: WARM, 3: 'back' } : { 1: 'line', 2: 'line', 3: 'back' });
}

const ARTS = { feed, context, radar, browser, belt };

/**
 * `canvases`: the .art canvases. Returns draw(pal, H, time, lit) to call every frame: each canvas is redrawn only when
 * its progress, the palette or (for the radar) the time changed, and only while its section is on screen.
 */
export function createArt(canvases, reducedMotion) {
  const items = canvases.map((cv) => ({
    cv, ctx: cv.getContext('2d'), fn: ARTS[cv.dataset.art], sec: cv.closest('.sec'),
    scheme: SCHEMES[cv.closest('.light') ? 'light' : 'dark'], key: '',
  })).filter((it) => it.fn && it.ctx);

  return function draw(pal, H, time, lit) {
    const palKey = pal.map((c) => c.map((v) => Math.round(v * 40)).join()).join();
    items.forEach((it) => {
      if (it.sec.style.visibility === 'hidden') return;
      const r = it.sec.getBoundingClientRect();
      const target = H / 2 + (parseFloat(it.sec.dataset.y) || 0) * H;
      const p = Math.round(clamp(1 - ((r.top + r.bottom) / 2 - target) / (H * .6)) * 48) / 48;
      const t = it.fn === radar && !reducedMotion ? Math.round(time * 30) / 30 : 0;
      const key = `${p}|${palKey}|${t}|${lit}`;
      if (key === it.key) return;
      it.key = key;
      it.ctx.clearRect(0, 0, it.cv.width, it.cv.height);
      it.fn(painter(it.ctx, pal, it.scheme), p, t, lit);
    });
  };
}
