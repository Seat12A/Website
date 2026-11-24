/*
 * Scrolling: the flight track, the texts placed along it, and Lenis (smooth wheel scrolling, as on Aria).
 *
 * Wheel and trackpad are braked when a text gets close to the middle of the screen (down to 28 %): text and landscape
 * slow down together, then speed up again. Before the footer, a strong brake and a spring: you have to push on purpose
 * to get there; stop too early and it brings you back to the arrival. On touch screens, native scrolling (the spring
 * still works).
 */
import Lenis from 'lenis';
import { clamp, smooth } from './util.js';

/** The flight lasts 9 screens × STRETCH of scrolling. */
const STRETCH = 1.4;

export function createScroll({ track, sections, reducedMotion }) {
  const secF = sections.map((el) => parseFloat(el.style.getPropertyValue('--f')));
  let H = innerHeight;
  const span = () => 9 * H * STRETCH;
  const fOf = (sc) => clamp(sc / span());
  const sOf = (f) => f * span();
  const maxScroll = () => Math.max(1, track.offsetHeight - innerHeight);

  function layout() { H = innerHeight; track.style.height = H + span() + 'px'; }
  layout();
  addEventListener('resize', layout);

  /** Each section is centred when the scroll reaches sOf(--f), shifted by data-y (fraction of the screen). */
  function placeTexts(sc) {
    sections.forEach((el, i) => {
      const y = sOf(secF[i]) - sc + (parseFloat(el.dataset.y) || 0) * H;
      const tx = el.classList.contains('left') && innerWidth > 760 ? '0' : '-50%';
      el.style.transform = `translate(${tx}, calc(-50% + ${y.toFixed(1)}px))`;
      el.style.visibility = Math.abs(y) > H * 1.2 ? 'hidden' : 'visible';
    });
  }

  function brake(y, d) {
    const end = maxScroll(), gap = H * .22;
    let dist = 1e9;
    secF.forEach((f) => { dist = Math.min(dist, Math.abs(y - sOf(f))); });
    let k = .28 + .72 * smooth(clamp(dist / (H * .4)));
    if (d > 0 && y > end - 4 && y < end + gap + 60) k = Math.min(k, .16);
    return k;
  }

  let lenis = null, lastInput = 0;
  if (!reducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    try {
      lenis = new Lenis({
        lerp: .1, smoothWheel: true, wheelMultiplier: 1,
        virtualScroll: (e) => { e.deltaY *= brake(lenis ? lenis.targetScroll : scrollY, e.deltaY); lastInput = performance.now(); return true; },
      });
    } catch (err) { lenis = null; }
  }
  addEventListener('touchend', () => { lastInput = performance.now(); }, { passive: true });
  addEventListener('scroll', () => { if (!lenis) lastInput = performance.now(); }, { passive: true });

  /** To be called every frame. */
  function tick(now) {
    if (lenis) lenis.raf(now);
    if (now - lastInput > 380 && !(lenis && lenis.isScrolling)) {
      const end = maxScroll(), gap = H * .22, y = scrollY;
      if (y > end + 1 && y < end + gap * .6) {                                           /* the spring */
        if (lenis) lenis.scrollTo(end, { duration: .9 }); else scrollTo({ top: end, behavior: 'smooth' });
      }
      lastInput = now;
    }
  }

  /** Flies to a point of the flight. */
  function go(f) {
    const y = clamp(sOf(f), 0, document.documentElement.scrollHeight - innerHeight);
    if (lenis) lenis.scrollTo(y, { duration: 2.4 }); else scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
  /** Jumps to a point of the flight at once (verification scripts). */
  function jump(f) {
    if (lenis) lenis.scrollTo(sOf(f), { immediate: true, force: true }); else scrollTo(0, sOf(f));
  }

  return { fOf, sOf, placeTexts, tick, go, jump, get smooth() { return !!lenis; } };
}
