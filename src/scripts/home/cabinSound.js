/*
 * Cabin sound, off by default: ambience only (engine rumble, ventilation, airframe vibration), synthesised with
 * Web Audio and muffled. No announcements (rejected). One chime: when the plane is parked on arrival, and only if the
 * sound is on.
 */
export function createCabinSound() {
  let ac = null, master = null, on = false;

  const noise = (sec, brown) => {
    const buf = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  };

  function boot() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    const loop = (buf, nodes, gain) => {
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      let n = src; nodes.forEach((x) => { n.connect(x); n = x; });
      const g = ac.createGain(); g.gain.value = gain; n.connect(g).connect(master); src.start();
    };
    const filter = (type, fq) => { const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = fq; return x; };
    loop(noise(8, true), [filter('lowpass', 240)], .95);                                   /* the rumble, low and dull */
    loop(noise(6, false), [filter('lowpass', 1100), filter('highpass', 180)], .07);         /* the ventilation */
    const o = ac.createOscillator(); o.frequency.value = 68;                                /* the airframe vibration */
    const og = ac.createGain(); og.gain.value = .03;
    const lfo = ac.createOscillator(); lfo.frequency.value = .11;
    const lg = ac.createGain(); lg.gain.value = .012; lfo.connect(lg).connect(og.gain); lfo.start();
    o.connect(og).connect(master); o.start();
  }

  async function toggle() {
    if (!ac) boot();
    on = !on;
    master.gain.cancelScheduledValues(ac.currentTime);
    if (on) { await ac.resume(); master.gain.linearRampToValueAtTime(.5, ac.currentTime + 1.5); }
    else master.gain.linearRampToValueAtTime(0, ac.currentTime + .4);
    return on;
  }

  /** The seat-belt chime: one soft, high note that fades out (only when the sound is on). */
  function chime() {
    if (!on || !ac) return;
    const t = ac.currentTime, g = ac.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6);
    g.connect(ac.destination);
    [[988, 1], [1976, .18]].forEach(([fq, k]) => {
      const o = ac.createOscillator(), og = ac.createGain();
      o.frequency.value = fq; og.gain.value = k; o.connect(og).connect(g); o.start(t); o.stop(t + 1.7);
    });
  }

  return { toggle, chime };
}
