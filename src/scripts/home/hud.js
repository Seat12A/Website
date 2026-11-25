/* Heads-up elements over the scene: the altimeter and the pixel-art pictograms of the rules. */
import { clamp, lerp } from './util.js';

/* ---------- Altimeter: rolling digits, a small pixel plane that follows the pitch ---------- */
export function createAltimeter(digitsEl, planeEl) {
  const cols = [];
  for (let i = 0; i < 5; i++) {
    const d = document.createElement('span'); d.className = 'd' + (i === 2 ? ' gap' : '');
    const c = document.createElement('span'); c.className = 'col';
    for (let k = 0; k < 10; k++) { const s = document.createElement('span'); s.textContent = k; c.appendChild(s); }
    d.appendChild(c); digitsEl.appendChild(d); cols.push([d, c]);
  }
  let lastShown = -1, vs = 0, lastAlt = 13, lastPitch = 99;
  return function update(ft) {
    const shown = ft < 60 ? 0 : Math.round(ft / 100) * 100;
    if (shown !== lastShown) {
      const s = String(shown).padStart(5, '0'); let lead = true;
      cols.forEach(([d, c], i) => {
        const n = +s[i];
        if (n !== 0 || i === 4) lead = false;
        d.classList.toggle('lead', lead);
        c.style.transform = `translateY(${-n}em)`;
      });
      lastShown = shown;
    }
    vs = lerp(vs, ft - lastAlt, .08); lastAlt = ft;
    const pitch = Math.round(clamp(-vs * .9, -12, 9));
    if (pitch !== lastPitch) { planeEl.style.transform = `rotate(${pitch}deg)`; lastPitch = pitch; }
  };
}

/* ---------- Pictograms: 16×16 maps redrawn with the tones of the current scene ---------- */
const PICTOS = {
  balance:   ['................', '.......33.......', '..333333333333..', '..2....22....2..', '.222...22...222.', '2...2..22..2...2', '2...2..22..2...2', '22222..22..22222', '.......22.......', '.......22.......', '.......22.......', '.......22.......', '.....222222.....', '....22222222....', '................', '................'],
  magnifier: ['................', '....33333.......', '...3.....3......', '..3..222..3.....', '..3.......3.....', '..3..2222.3.....', '..3.......3.....', '..3..22...3.....', '...3.....3......', '....333332......', '..........2.....', '...........2....', '............2...', '.............2..', '..............2.', '................'],
  heart:     ['................', '................', '...222....222...', '..23332..23332..', '.23333322333332.', '.23333333333332.', '.23333333333332.', '..233333333332..', '...2333333332...', '....23333332....', '.....233332.....', '......2332......', '.......22.......', '................', '................', '................'],
  code:      ['................', '................', '.........3......', '.....22..32.....', '....22..3.22....', '...22...3..22...', '..22....3...22..', '.22....3.....22.', '.22....3.....22.', '..22...3....22..', '...22.3....22...', '....223...22....', '.....23..22.....', '......3.........', '................', '................'],
  book:      ['................', '................', '.....22..22.....', '.2222..22..2222.', '.23333311333332.', '.23111311311132.', '.23333311333332.', '.23111311311132.', '.23333311333332.', '.23111311311132.', '.23333311333332.', '.23333311333332.', '.22222211222222.', '.......22.......', '................', '................'],
  link:      ['................', '................', '........33333...', '.......33...33..', '.......3.....3..', '.......3.....3..', '.......3.....3..', '...222233...33..', '..22...233333...', '..2.....2.......', '..2.....2.......', '..2.....2.......', '..22...22.......', '...22222........', '................', '................'],
  photo:     ['................', '.22222222222222.', '.2............2.', '.2.........33.2.', '.2.........33.2.', '.2....1.......2.', '.2...111.1....2.', '.2..1111111...2.', '.2.111111111112.', '.22222222222222.', '................', '................', '.33333333333333.', '................', '.333333333......', '................'],
};

export function createPictos(canvases) {
  let lastKey = '';
  return function draw(pal) {
    const key = pal.map((c) => c.map((v) => Math.round(v * 40)).join()).join();
    if (key === lastKey) return;
    lastKey = key;
    const tone = { 1: pal[3], 2: pal[5], 3: pal[7] };
    canvases.forEach((cv) => {
      const map = PICTOS[cv.dataset.p], ctx = cv.getContext('2d');
      if (!map) return;
      ctx.clearRect(0, 0, 16, 16);
      map.forEach((row, y) => [...row].forEach((ch, x) => {
        const c = tone[ch]; if (!c) return;
        ctx.fillStyle = `rgb(${c.map((v) => Math.round(v * 255))})`; ctx.fillRect(x, y, 1, 1);
      }));
    });
  };
}
