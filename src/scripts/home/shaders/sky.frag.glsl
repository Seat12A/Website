#version 300 es
/*
 * Pass 1 of the flight scene: one colour per cell.
 *
 * Everything is drawn as a TONE (0..1) on the scene's 8-tone ladder (uPal), then pal() dithers between two
 * neighbouring tones (Bayer 4x4). Never mix colours before dithering, only tones: mixing two distant colours gives a
 * checkerboard. Tones above 0.86 are reserved for the sun disk.
 * Only off-ladder colours: the warm light of windows and cities, and real aviation lights (red, blue, green, white).
 *
 * Order of main(): frame and horizon, calm zone, sky and sun (with the 22° halo and sun dogs), night sky, a contrail
 * crossing above, ground phase (cloud layer, ground, buildings), Eiffel Tower beacon, sea of clouds (with the
 * contrail's shadow) and fog (lit by the strobe), left wing, navigation lights.
 *
 * Phenomena that illustrate the texts are drawn as an atmosphere, not as precise shapes (pixels cannot do precise):
 * halo and sun dogs at the breakthrough, strobe flashes lighting the fog, a contrail and its shadow in cruise, light
 * running along the streets of Paris (the network), the "rabbit" of approach lights on the parallel runway.
 */
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uPal[8];
uniform float uSea, uFog, uCover, uTop, uBot, uLo, uHi, uGlow, uRays, uStars, uOffY, uFlash;
uniform vec3 uSun; uniform vec2 uWing;
uniform float uGround, uH, uTravel, uTilt, uHorizon, uNight, uCity, uStrobe, uWingS, uBlink, uGlint;
uniform vec4 uRwy; uniform vec4 uCalm; uniform float uCalmK;
uniform vec4 uMoon; uniform vec3 uMoonL; uniform float uMilky; uniform vec4 uMet; uniform vec2 uMet2;
uniform float uFogDir; uniform float uFlightX;
uniform float uHalo; uniform vec2 uContrail; uniform float uNet;
const float F = 1.2;                                     /* focal length of the camera (screen height = 1) */
const float B[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
float bay(vec2 fc){ return (B[int(mod(fc.y, 4.)) * 4 + int(mod(fc.x, 4.))] + .5) / 16.; }
float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { s += a * vn(p); p = m * p; a *= .5; } return s; }
float fbm3(vec2 p){ float a = .5, s = 0.; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) { s += a * vn(p); p = m * p; a *= .5; } return s * 1.14; }
vec3 pal(float t, float b){ float q = clamp(t, 0., 1.) * 7.; float i = floor(q); i += step(b, q - i); return uPal[int(min(i, 7.))]; }

/* City lights that never flicker: at each distance, points anchored to the ground on a grid whose spacing follows the
   size of a pixel. Moving away, the points of the fine grid switch off one by one while those of the coarser grid
   switch on. Each light stays attached to its spot on the ground. */
float cityLight(vec2 w, float fwx, float fwz, float dens, out float br){
  float lev = max(0., log2(max(fwx, fwz) / 8.)), L0 = floor(lev), fr = lev - L0, on = 0.; br = 0.;
  for (int i = 0; i < 2; i++) {
    float L = L0 + float(i), sz = 16. * exp2(L);
    vec2 cell = floor(w / sz), seed = cell + L * 13.7;
    float keep = h(seed + 2.9);
    if ((i == 0 ? keep < fr : keep >= fr) || h(seed + 5.3) > dens) continue;
    vec2 pos = (cell + .2 + .6 * vec2(h(seed + .3), h(seed + 7.1))) * sz, d = abs(w - pos);
    if (d.x < max(.9, .5 * fwx) && d.y < max(.9, .5 * fwz)) { on = 1.; br = .65 + .35 * h(seed + 9.); }
  }
  return on;
}
float G(float t){ return .02 + t * .40; }                 /* ground: the bottom of the ladder */
float Bt(float t){ return .06 + t * .46; }                /* buildings: the middle of the ladder */
/* a row of point lights along x, without halo: one sharp dot each */
float lamp(float wx, float period, float z, float zl, float r, float fwx, float fwz){
  if (fwx > period * .45) return 0.;
  float dx = abs(mod(wx, period) - period * .5), dz = abs(z - zl);
  return (dx < max(r, .5 * fwx) && dz < max(r * .7, .5 * fwz)) ? 1. : 0.; }

/* ---------- the ground: few tones, large masses; returns a ladder tone ---------- */
float ground(vec2 w, float fwx, float fwz, out float emit, out vec3 ecol, out float wet){
  emit = 0.; ecol = vec3(0.); wet = 0.;
  float z = w.y, n = uNight, fw = max(fwx, fwz);
  vec3 warm = vec3(1., .74, .38);
  float shade = smoothstep(.50, .66, fbm3(w * .00022 + vec2(uTime * .006, 0.))) * (1. - n);
  float t = .4;
  bool rA = w.x > uRwy.x && w.x < uRwy.y, rB = w.x > uRwy.z && w.x < uRwy.w;
  bool apt = (w.x > uRwy.x - 700. && w.x < uRwy.y + 700.) || (w.x > uRwy.z - 700. && w.x < uRwy.w + 700.);
  /* arrival: a parallel runway, 1 km to the left (z 978–1022), and its approach lights. Twice a second a white flash runs along them
     towards the threshold: pilots call it the rabbit. */
  if (uCity > .5 && n > .08 && abs(z - 1000.) < 32. && w.x > uRwy.z - 900. && w.x < uRwy.w) {
    float thr = uRwy.z;
    if (w.x < thr) {
      float i = floor((w.x - (thr - 900.)) / 30.), run = floor(fract(uTime * 2.) * 30.), gap = run - i;
      bool flash = gap > -.5 && gap < .5;
      /* each station is a short bar of lamps across the line; the flashing one looks bigger */
      if (lamp(w.x, 30., z, 1000., flash ? 4. : 1.4, fwx, fwz) > 0. || (abs(z - 1000.) < 8. && lamp(w.x, 30., z, z, 1.4, fwx, fwz) > 0.)) {
        emit = 1.; ecol = flash ? vec3(1.) : gap > .5 && gap < 2.5 ? vec3(1., .95, .85) : vec3(1., .88, .66) * .75;
        return G(.12);
      }
      if (abs(w.x - (thr - 300.)) < max(1.3, .5 * fwx) && abs(z - 1000.) < 16. && fract(z / 4.) < .5) { emit = 1.; ecol = uPal[6]; }   /* the crossbar */
      return G(.16);
    }
    if (abs(w.x - thr) < max(1.2, .5 * fwx) && abs(z - 1000.) < 22. && fract(z / 4.) < .5) { emit = 1.; ecol = vec3(.35, 1., .55); return G(.1); }  /* threshold */
    if (abs(z - 1000.) < 23.) {
      if (lamp(w.x, 60., z, 978., .5, fwx, fwz) > 0. || lamp(w.x, 60., z, 1022., .5, fwx, fwz) > 0.) { emit = 1.; ecol = uPal[7]; }
      return G(.1);
    }
  }
  if (apt && z < 560.) {
    if ((rA || rB) && z < 34.) {                                                      /* runway and its edge line */
      if (z > 32.6) return .5;
      return G(.1);
    }
    if ((rA || rB) && n > .08 && lamp(w.x, 60., z, 36.5, .35, fwx, fwz) > 0.) { emit = 1.; ecol = uPal[7]; }
    if (z > 150. && z < 172.) { if (n > .08 && lamp(w.x, 15., z, 161., .25, fwx, fwz) > 0.) { emit = 1.; ecol = vec3(.35, 1., .55); } return G(.14); }
    if (n > .08 && (lamp(w.x, 50., z, 147.5, .3, fwx, fwz) > 0. || lamp(w.x + 25., 50., z, 174.5, .3, fwx, fwz) > 0.)) { emit = 1.; ecol = uPal[6]; }
    if (z > 380.) return G(.18);
    t = .36 + (vn(w * .01) - .5) * .05;
  } else {
    if (uCity > .5) {                                                                    /* Paris, at night */
      vec2 dq = w - vec2(98600., 6200.);
      float rad = length(dq * vec2(.75, 1.)) + (fbm3(w * .0004) - .5) * 1600.;
      if (rad < 5600.) {
        float sz = 4700. + 1300. * sin((w.x - 98600.) / 2400.) + 350. * sin((w.x - 98600.) / 780.);
        float sd = abs(z - sz);
        if (sd < max(85., fwz * .7)) {                                                   /* the Seine and its lit bridges */
          if (abs(mod(w.x, 460.) - 230.) < max(7., .6 * fwx)) { emit = 1.; ecol = fract(z / 14.) < .5 ? warm : warm * .7; return G(.2); }
          wet = 1.; return G(.1);
        }
        if (sd < 110. && lamp(w.x, 20., z, sz + sign(z - sz) * 96., 1., fwx, fwz) > 0.) { emit = 1.; ecol = warm; }   /* the quays */
        vec2 gq = mat2(.86, -.5, .5, .86) * dq;
        bool street = abs(mod(gq.x, 150.) - 75.) < max(5., fwx * .5) || abs(mod(gq.y, 120.) - 60.) < max(5., fwz * .5);
        vec2 et = w - vec2(96900., 7400.); float le = length(et);
        if (le < 3200. && abs(fract(atan(et.y, et.x) / 6.2832 * 12.) - .5) * le * .52 < max(8., fw * .6)) street = true;   /* the Étoile */
        /* the network: light runs along the streets, out from the centre, and a wave of light spreads as the text on the
           internet is read. Only some streets carry it, so it reads as a web, not as a grid. */
        if (uNet > .01 && street) {
          bool alongY = abs(mod(gq.x, 150.) - 75.) < max(5., fwx * .5), alongX = abs(mod(gq.y, 120.) - 60.) < max(5., fwz * .5);
          float along = alongY ? abs(gq.y) : alongX ? abs(gq.x) : le;
          float lane = alongY ? floor(gq.x / 150.) : alongX ? floor(gq.y / 120.) + 50. : 99.;
          float front = uNet * 6400., near = 1. - smoothstep(16., 34., fw);              /* far away, streets fill every cell */
          if (rad < front && near > 0. && h(vec2(lane, 3.7)) < .5) {
            float pulse = fract((along - uTime * 340. + h(vec2(lane, 1.3)) * 900.) / 640.);
            if (pulse < .07) { emit = 1.; ecol = mix(warm, uPal[7], .55); return G(.22); }
            if (fract(along / max(12., fw * 2.)) < .5 && h(vec2(floor(along / 40.), lane)) < near * .8) { emit = 1.; ecol = warm * .55; return G(.22); }
          }
        }
        float dens = 1. - rad / 5600. * .45, lb;
        if (emit < .5 && cityLight(w, fwx, fwz, (street ? .95 : .5) * dens, lb) > 0.) { emit = 1.; ecol = warm * lb; }
        return G(street ? .22 : .13);
      }
    }
    vec2 p = mat2(.94, -.34, .34, .94) * w;
    float S = 220.;
    vec2 cid = floor(p / S), cf = fract(p / S), sub = cf, csz = vec2(S);
    float hs = h(cid);
    if (hs > .55) { cid.x += step(.5, cf.x) * .5; sub.x = fract(cf.x * 2.); csz.x = S * .5; }
    float k = h(cid + .7);
    t = k < .3 ? .30 : k < .6 ? .37 : k < .85 ? .44 : .52;
    vec2 ed = min(sub, 1. - sub) * csz;
    if (min(ed.x, ed.y) < 4. && fw < 5.) t -= .08;
    if (fbm3(w * .0011 + 3.) > .60) t = .17;                                             /* forests */
    float rz = 2600. + sin(w.x * .0007) * 700. + (fbm3(vec2(w.x * .0004, 1.)) - .5) * 900.;
    float rd = abs(z - rz);
    if (rd < max(26., fwz * .7)) wet = 1.;                                               /* the river */
    else if (rd < 44. && fw < 8.) t = .13;
    float hz = 5200. + 900. * sin(w.x * .00035) + (fbm3(vec2(w.x * .0002, 4.)) - .5) * 800.;
    float dz = z - hz;
    if (abs(dz) < max(13., fwz * .6)) {                                                 /* the motorway: headlights */
      t = .5;
      if (n > .05) { float dirc = dz < 0. ? 1. : -1., lane = dz < 0. ? -6.5 : 6.5, cx = w.x - dirc * uTime * 32.;
        if (lamp(cx, 38., z, hz + lane, 1.2, fwx, fwz) > 0. && h(vec2(floor(cx / 38.), lane)) < .5) { emit = 1.; ecol = dz < 0. ? uPal[7] : warm; } }
    }
    float town = fbm3(w * .0006 + 11.);
    if (town > .6) {                                                                     /* villages: a lighter patch; lit only on arrival */
      t += .04;
      if (uCity > .5) {
        float lb2;
        if (cityLight(w + 3100., fwx, fwz, .3 * n * smoothstep(.6, .7, town), lb2) > 0.) { emit = 1.; ecol = warm * lb2; }
      }
    }
  }
  return G(t - shade * .08);
}

/* ---------- standing objects: airport (tower, terminal, parked plane, masts) and Paris monuments; returns a tone ---------- */
bool building(float sx, float sy, float base, out float bt, out float zb, out float em, out vec3 ec){
  em = 0.; ec = vec3(1., .74, .38); bt = 0.; zb = 1e9;
  if (uCity > .5) {                                                                      /* Paris: a few stylised monuments */
    vec3 lit = vec3(1., .74, .38);
    /* Notre-Dame, on its island */
    vec2 q = vec2(sx * 5000. / F + uTravel - 99700., (sy + uH * F / 5000.) * 5000. / F);
    if (q.y > 0. && q.y < 97.) {
      bool tw = (abs(q.x + 12.) < 5.5 || abs(q.x - 2.) < 5.5) && q.y < 69.;
      bool nave = q.x > 7. && q.x < 62. && q.y < 33. - max(q.x - 55., 0.) * 1.5;
      bool spire = abs(q.x - 40.) < 1. && q.y < 96.;
      if (tw || nave || spire) { bt = Bt(.5); zb = 5000.; em = h(floor(q / 4.)) < .35 ? 1. : 0.; ec = lit * .9; return true; }
    }
    /* Montparnasse tower */
    q = vec2(sx * 6000. / F + uTravel - 99300., (sy + uH * F / 6000.) * 6000. / F);
    if (q.y > 0. && q.y < 210. && abs(q.x) < 26.) {
      bt = Bt(.22); zb = 6000.;
      if (fract(q.x / 4.) < .5 && fract(q.y / 3.6) < .5 && h(floor(q / vec2(4., 3.6))) < .3) { em = 1.; ec = lit * .85; }
      if (q.y > 205. && abs(abs(q.x) - 24.) < 2.) { em = uBlink; ec = vec3(1., .25, .2); }
      return true;
    }
    /* Arc de Triomphe, in the middle of the Étoile */
    q = vec2(sx * 7400. / F + uTravel - 96900., (sy + uH * F / 7400.) * 7400. / F);
    if (q.y > 0. && q.y < 50. && abs(q.x) < 23. && !(abs(q.x) < 7. && q.y < 29.)) { bt = Bt(.6); zb = 7400.; em = h(floor(q / 3.)) < .45 ? 1. : 0.; ec = lit; return true; }
    /* Sacré-Cœur, on its hill */
    q = vec2(sx * 8600. / F + uTravel - 101200., (sy + uH * F / 8600.) * 8600. / F);
    if (q.y > 0. && q.y < 170.) {
      bool hill = q.y < 85. * pow(max(1. - abs(q.x) / 420., 0.), .6);
      bool body = abs(q.x) < 38. && q.y > 80. && q.y < 116.;
      bool dome = length(vec2(q.x, q.y - 120.) / vec2(17., 27.)) < 1. && q.y > 112.;
      bool lant = abs(q.x) < 2.5 && q.y < 160. && q.y > 140.;
      bool side = length(vec2(abs(q.x) - 27., q.y - 118.) / vec2(7., 10.)) < 1.;
      if (body || dome || lant || side) { bt = Bt(.95); zb = 8600.; em = h(floor(q / 5.)) < .12 ? 1. : 0.; ec = lit; return true; }
      if (hill) { bt = Bt(.1); zb = 8600.; return true; }
    }
    /* La Défense, far away: towers and the Grande Arche */
    q = vec2(sx * 10500. / F + uTravel - 95000., (sy + uH * F / 10500.) * 10500. / F);
    if (q.y > 0. && q.y < 235. && q.x > -170. && q.x < 330.) {
      float tx = q.x < -100. ? -140. : q.x < -20. ? -60. : q.x < 55. ? 20. : q.x < 125. ? 90. : 160.;
      float tw2 = tx == -140. ? 12. : tx == -60. ? 15. : tx == 20. ? 11. : tx == 90. ? 17. : 13.;
      float th = tx == -140. ? 160. : tx == -60. ? 231. : tx == 20. ? 190. : tx == 90. ? 210. : 150.;
      if (abs(q.x - tx) < tw2 && q.y < th) {
        bt = Bt(.2); zb = 10500.;
        if (fract(q.x / 3.) < .5 && fract(q.y / 3.6) < .5 && h(floor(q / vec2(3., 3.6))) < .32) { em = 1.; ec = lit * .8; }
        return true;
      }
      if (abs(q.x - 265.) < 55. && q.y < 110. && !(abs(q.x - 265.) < 37. && q.y > 14. && q.y < 92.)) { bt = Bt(.75); zb = 10500.; em = h(floor(q / 4.)) < .2 ? 1. : 0.; ec = lit; return true; }
    }
    /* the Eiffel Tower, golden, in one piece */
    float ze = 4300., we = sx * ze / F + uTravel - 98100., he = (sy + uH * F / ze) * ze / F;
    if (he > 0. && he < 330.) {
      float hwE = 62. * pow(max(1. - he / 300., 0.), 2.2) + 2.5;
      bool arch = he < 50. && abs(we) < hwE * .55 * (1. - pow(he / 50., 2.));
      bool deck = (abs(he - 57.) < 3. && abs(we) < hwE + 4.) || (abs(he - 115.) < 2.5 && abs(we) < hwE + 2.);
      if ((abs(we) < hwE && !arch) || deck || (he > 300. && abs(we) < 1.2)) {
        bt = Bt(.45); zb = ze; em = 1.; ec = h(floor(vec2(we, he) / 3.)) < .25 ? vec3(1., .9, .66) : vec3(1., .72, .34);
        if (he > 318.) { em = uBlink; ec = vec3(1., .25, .2); }
        return true;
      }
    }
  }
  if (uNight > .3) {                                                                     /* apron light masts */
    float zm = 520., wm = sx * zm / F + uTravel - base, hm = (sy + uH * F / zm) * zm / F;
    if (wm > 250. && wm < 1350. && hm > 0. && hm < 27.) {
      float lm = abs(mod(wm - 300., 180.) - 90.);
      if (lm < .5 && hm < 25.) { bt = Bt(.25); zb = zm; return true; }
      if (lm < 2. && hm > 24.) { bt = Bt(.9); zb = zm; em = 1.; ec = vec3(1., .92, .72); return true; }
    }
  }
  float zt = 330., wx = sx * zt / F + uTravel - base, hy = (sy + uH * F / zt) * zt / F;
  if (hy > 0. && hy < 56.) {
    float dx = abs(wx - 470.);
    if (hy > 46.5 && hy < 55. && dx < .5) { bt = Bt(.3); zb = zt;                       /* airport beacon: green, white */
      if (hy > 53.) { em = uNight > .3 ? 1. : uBlink; ec = uNight > .3 ? (uBlink > .5 ? vec3(.35, 1., .5) : vec3(1.)) : vec3(1., .25, .2); } return true; }
    if (hy > 44.5 && hy < 46.5 && dx < 9.) { bt = Bt(.85); zb = zt; return true; }
    if (hy > 36. && hy < 44.5 && dx < 8.) { zb = zt;                                      /* control tower cab */
      bool glass = hy > 37.5 && hy < 43.;
      bt = glass ? Bt(.15 + .25 * step(.6, fract(wx / 3.))) : Bt(.7);
      if (glass && uNight > .3) em = 1.; return true; }
    if (hy < 36. && dx < 3.2) { bt = Bt(.62 - (wx - 470.) * .06); zb = zt; return true; }
  }
  float zp = 405.; wx = sx * zp / F + uTravel - base; hy = (sy + uH * F / zp) * zp / F;
  if (wx > 1320. && wx < 1362. && hy > 0.) {                                             /* parked airliner */
    float u = wx - 1320.;
    bool fus = hy > 2.6 && hy < 7.6 - smoothstep(30., 42., u) * 2.4 && u > 1.5 - (hy - 2.6) * .3;
    bool fin = u > 33. && hy > 7. && hy < 7. + (u - 33.) * 1.7 && u < 41.5;
    if (fus || fin) { zb = zp; bool win = fus && hy > 5.6 && hy < 6.2 && fract(u / 1.3) < .5;
      bt = fin ? Bt(.2) : win ? Bt(.25) : Bt(.9 - (hy - 2.6) * .02);
      if (win && uNight > .3) em = 1.; return true; }
  }
  float za = 430.; wx = sx * za / F + uTravel - base; hy = (sy + uH * F / za) * za / F;
  if (hy > 0. && hy < 15. && wx > 560. && wx < 1300.) { zb = za;                          /* terminal */
    bool win = hy > 5. && hy < 9.5 && fract(wx / 6.) < .7;
    bt = hy > 13.5 ? Bt(.9) : win ? Bt(.22) : Bt(.55);
    if (win && uNight > .3 && h(vec2(floor(wx / 6.), 1.)) < .7) em = 1.; return true; }
  return false;
}

void main(){
  vec2 fc = gl_FragCoord.xy, uv = fc / uRes; float asp = uRes.x / uRes.y;
  float b = bay(fc);
  vec2 cc = vec2((uv.x - .5) * asp, uv.y - .5);
  float cs = cos(uTilt), sn = sin(uTilt);
  vec2 r = vec2(cs * cc.x - sn * cc.y, sn * cc.x + cs * cc.y);
  float sx = r.x, sy = r.y + .5 - uHorizon, ry = r.y + .5;   /* sy: height above the horizon */
  vec2 p = vec2(r.x + .5 * asp, ry);
  bool gnd = uGround > .5;
  /* calm zone behind the text being read: a very soft ellipse, no visible edge */
  vec2 cc0 = (uCalm.xy + uCalm.zw) * .5, chs = max((uCalm.zw - uCalm.xy) * .5, vec2(.01));
  float ce = length((uv - cc0) / chs);
  float calm = uCalmK * (1. - smoothstep(.55, 1.35, ce));

  /* ---- sky ---- */
  float T = gnd ? mix(uBot, uTop, clamp(sy * 2.8, 0., 1.)) : mix(uBot, uTop, ry);
  vec2 sd = p - vec2(uSun.x * asp, uSun.y); float d = length(sd);
  T += uGlow * exp(-d * d / max(uSun.z * uSun.z * 26., 1e-4)) * (1. - calm * .5);
  T += uRays * pow(vn(vec2(atan(sd.y, sd.x) * 9. + 40., uTime * .05)), 3.) * exp(-d * 2.6) * .3 * (1. - calm * .7);
  if (uHalo > .01 && uSun.z > 0.) {
    /* 22° halo and sun dogs (parhelia), made by ice crystals in a thin veil. The ring sits tan(22°) × F ≈ 0.485 screen
       heights from the sun; the sky just inside it is a little darker, as in reality. The sun dogs: bright patches on
       each side, at the height of the sun, with a tail pointing away from it; a faint line joins them. Patchy, like
       the veil that makes them. */
    float R = .485, k = uHalo * (1. - calm * .5) * (.55 + .7 * fbm3(p * 2.6 + vec2(uTime * .015, 0.)));
    float hal = exp(-pow((d - R) / .022, 2.)) * .13 - (d < R ? smoothstep(R - .16, R - .015, d) * .035 : 0.);
    for (int i = 0; i < 2; i++) {
      float sg = i == 0 ? -1. : 1.;
      vec2 q = p - vec2(uSun.x * asp + sg * R * 1.05, uSun.y);
      hal += exp(-(q.x * q.x / .0016 + q.y * q.y / .0005)) * .32;
      if (sg * q.x > 0.) hal += exp(-q.y * q.y / .00025) * exp(-sg * q.x * 7.) * .12;
    }
    hal += exp(-pow((p.y - uSun.y) / .006, 2.)) * smoothstep(.06, .3, d) * .035;
    T += hal * k;
  }
  T = min(T, .86);                                                                     /* the lightest tone is reserved for the disk */
  /* the sun disk belongs to the sky: everything after it (veils, clouds, ground) passes in front */
  float disk = (uSun.z > 0. && d < uSun.z && !(gnd && sy < 0.)) ? 1. : 0.;
  if (disk > .5) T = 1.03;
  /* ---- night: Milky Way, stars, moon, shooting stars; clouds pass in front ---- */
  float starB = 0.;
  bool skyUp = !gnd || sy > 0.;
  if (uStars > .01 && skyUp) {
    float vis = uStars * (gnd ? smoothstep(.06, .3, sy) : 1.) * (1. - calm * .85);
    float band = 0.;
    if (uMilky > .01) {                                                                   /* a diagonal band with its dust lanes */
      vec2 q = (uv - vec2(.62, .8)) * vec2(asp, 1.), dir = normalize(vec2(1., .5));
      float dp = abs(dot(q, vec2(-dir.y, dir.x))), al = dot(q, dir);
      band = exp(-dp * dp * 24.) * (.5 + .5 * fbm3(vec2(al * 3., dp * 6.) + 4.));
      float lane = smoothstep(.5, .66, fbm3(vec2(al * 7., dp * 18.) + 9.)) * exp(-dp * dp * 70.);
      T += uMilky * vis * (band * .15 - lane * .07);
    }
    vec2 c = floor(fc);
    float dens = .0024 * (1. + 2.6 * band * uMilky);
    float r2 = h(c + 9.1);
    if (h(c + .37) < dens) { float tw = .5 + .5 * sin(uTime * 1.1 + r2 * 60.); starB = r2 > .97 ? 1. : .3 + r2 * .45 - tw * .12; }
    else {                                                                                 /* the brightest ones: a small cross */
      if (h(c + vec2(1., 0.) + .37) < dens && h(c + vec2(1., 0.) + 9.1) > .97) starB = .5;
      if (h(c + vec2(-1., 0.) + .37) < dens && h(c + vec2(-1., 0.) + 9.1) > .97) starB = .5;
      if (h(c + vec2(0., 1.) + .37) < dens && h(c + vec2(0., 1.) + 9.1) > .97) starB = .5;
      if (h(c + vec2(0., -1.) + .37) < dens && h(c + vec2(0., -1.) + 9.1) > .97) starB = .5;
    }
    starB *= vis;
    if (uMet2.y > 0.) {                                                                    /* shooting star: a head and a fading trail */
      vec2 rel = p - uMet.xy, dd = uMet.zw;
      float back = -dot(rel, dd) * uRes.y, off = abs(rel.x * dd.y - rel.y * dd.x) * uRes.y, len = uMet2.x * uRes.y;
      if (off < 1.1 && back > -1.5 && back < len) {
        float k2 = 1. - max(back, 0.) / len, mb = uMet2.y * k2;
        if (back < 1.5) starB = max(starB, uMet2.y);
        else if (b < mb) starB = max(starB, mb * .85);
      }
    }
  }
  if (uMoon.w > .01 && skyUp) {                                                            /* the moon: a lit sphere, its maria, earthshine */
    vec2 mq = (p - vec2(uMoon.x * asp, uMoon.y)) / uMoon.z; float rr = length(mq);
    T += uMoon.w * .09 * exp(-max(rr - 1., 0.) * 1.5) * (1. - calm * .6);
    if (rr < 1.) {
      float lam = dot(vec3(mq, sqrt(1. - rr * rr)), normalize(uMoonL));
      float mare = smoothstep(.52, .68, fbm3(mq * 2.4 + 5.));
      T = lam > 0. ? mix(T, .82 + lam * .25 - mare * .14, uMoon.w) : T + .05 * uMoon.w;
      starB = 0.;
    }
  }
  if (gnd) T += uNight * uCity * .12 * exp(-max(sy, 0.) * 9.);                           /* the city glow on the horizon */
  if (uCover > .01) {                                                                   /* soft high veils */
    float nf = fbm(p * vec2(1.1, 2.2) + vec2(uTime * .02 + uFlightX * .25, uOffY * .4));
    float cf = smoothstep(1. - uCover, 1. - uCover + .3, nf) * (gnd ? smoothstep(.16, .3, sy) : 1.) * (1. - calm * .9);
    T = mix(T, mix(uLo, uHi, .55 + .3 * nf), cf * .7);
  }
  if (!gnd || sy > 0.) T = mix(T, uTop + .06, calm * .12);
  vec2 cDir = normalize(vec2(1., -.03)), cN = vec2(-cDir.y, cDir.x);
  float cX = -.3 + uContrail.x * (asp + .6);                                           /* where the other plane is */
  if (uContrail.y > .01 && !gnd) {
    /* another airliner crosses far above: its contrail starts a little behind it, thin, then widens, wavers and
       spreads into a veil as it ages. That is how things spread. */
    vec2 rel = p - vec2(cX, .83 - uContrail.x * .05);
    float s = -dot(rel, cDir), pr = dot(rel, cN);
    if (s > .015) {
      float wd = .002 + s * .028, wav = (fbm3(vec2(s * 7. - uTime * .03, 3.)) - .5) * s * .09;
      float cd = (pr - wav) / wd;
      float dn = exp(-cd * cd) * exp(-s * .75) * (.7 + .6 * fbm3(vec2(s * 14., pr * 120.) + uTime * .08));
      T = mix(T, uHi - .14, clamp(dn, 0., 1.) * uContrail.y * (1. - calm * .5));
    }
    if (length(rel * uRes.y) < 1.3) T = uTop + .35;                                    /* the plane itself: one glint */
  }
  float emit = 0.; vec3 ecol = vec3(0.);

  if (gnd) {
    if (sy > 0.) {
      /* the cloud layer above us, in perspective: organic masses (warped noise), smaller towards the horizon; their side
         facing the sun is lit. Climbing, we get closer until we enter it. */
      float Hc = 1800.;
      if (Hc > uH + 8.) {
        float zr = (Hc - uH) * F / max(sy, 1e-3), zc = min(zr, 60000.);
        /* two readings of the same sky: in perspective high up (depth above us), as barely flattened masses near the
           horizon (so distant clouds keep some volume instead of collapsing into lines) */
        vec2 tl = vec2(clamp((uSun.x - .5) * asp - sx, -1., 1.) * .07, .07);
        vec2 wq = vec2(sx * zc / F + uTravel + uTime * 90., zc) / 2600.;
        vec2 wv = vec2(fbm3(wq * .8 + 2.), fbm3(wq * .8 + 7.3));
        float dP = fbm(wq + wv * .95), lP = fbm(wq + tl + wv * .95);
        float wS = max(1. - smoothstep(.05, .32, sy), smoothstep(30000., 60000., zr));
        float dens = dP, lit0 = lP;
        if (wS > 0.) {
          vec2 sq = vec2(sx * 2.4 + uTravel / 7000. + uTime * .022, sy * 6.5 + uH / 900.);
          vec2 sv = vec2(fbm3(sq * .7 + 4.), fbm3(sq * .7 + 9.1));
          float dS = fbm(sq + sv * 1.1) + (.12 - sy) * .5, lS = fbm(sq + vec2(tl.x * 3., .35) + sv * 1.1) + (.12 - sy - .05) * .5;
          dens = mix(dP, dS, wS); lit0 = mix(lP, lS, wS);
        }
        /* the closer we get, the more it closes up; at night the sky clears */
        float cv = dens - .5 - uCity * .16 + smoothstep(Hc - 1000., Hc - 60., uH) * .32;
        if (cv > -.06) {
          float lit = clamp((dens - lit0) * 5. + .5, 0., 1.);
          float a = smoothstep(-.06, .1, cv);
          float ct = mix(uLo - .22, uHi, lit * .7 + clamp(cv, 0., .3) * .9);
          float far = (1. - exp(-zc / 15000.)) * (1. - wS * .7);
          ct = mix(ct, uBot - .03, far * .4);
          float sunNear = uSun.z > 0. ? exp(-d * d / (uSun.z * uSun.z * 40.)) : 0.;          /* near the sun, clouds brighten and thin out */
          ct += sunNear * .3; a *= 1. - sunNear * .55;
          a *= smoothstep(Hc - 8., Hc - 320., uH);                                       /* it fades while we enter it */
          T = mix(T, ct, a * (1. - far * .3) * (1. - calm * .85));
        }
      }
    }
    if (sy < 0.) {
      float z = uH * F / (-sy);
      if (z < 90000.) {
        vec2 w = vec2(sx * z / F + uTravel, z);
        float fwx = z / (F * uRes.y), fwz = z * z / (max(uH, 1.) * F * uRes.y);   /* footprint of one cell on the ground */
        float wet; T = ground(w, fwx, fwz, emit, ecol, wet);
        if (wet > .5) {                                                                   /* water reflects the horizon */
          T = uBot - .12 + (vn(w * .05 + uTime) - .5) * .06;
          if (uCity > .5 && h(floor(w / vec2(10., 3.)) + floor(uTime * 4.)) < .07) { emit = 1.; ecol = vec3(1., .74, .38) * .7; }
          float spark = exp(-abs(sx - (uSun.x - .5) * asp) * 5.) * uGlow;
          if (h(floor(w / 4.) + floor(uTime * 6.)) < spark * .35) { emit = 1.; ecol = uPal[7]; }
        }
        float haze = clamp(1. - exp(-z / 13000.) + uH / 3000. * .15, 0., 1.);
        T = mix(T, mix(G(.66), uBot - .16, smoothstep(.6, .99, haze) * .7), haze);  /* far away, the ground melts into the horizon */
        if (haze > .85) emit = 0.;
      }
    }
    /* right at the horizon: a bank of haze and distant low clouds, so that no empty band shows */
    if (abs(sy) < .09) {
      vec2 mq = vec2(sx * 2.6 + uFlightX * .12 + uTime * .006, sy * 16.);
      float md = fbm(mq + vec2(fbm3(mq * .7 + 3.), 0.) * .8) - .42 - abs(sy - .012) * 7.;
      if (md > -.04) {
        float lit = clamp((md - (fbm(mq + vec2(.25, .4)) - .42 - abs(sy + .013) * 7.)) * 4. + .5, 0., 1.);
        float mt = mix(uBot - .32, uBot - .02, lit * .6 + clamp(md, 0., .25) * 1.6);
        T = mix(T, mt, smoothstep(-.04, .08, md) * (1. - calm * .6));
        emit *= 1. - smoothstep(-.04, .08, md);
      }
    }
    float bt, zb, be; vec3 bc;
    bool hit = building(sx, sy, uRwy.x, bt, zb, be, bc);
    if (!hit) hit = building(sx, sy, 100000., bt, zb, be, bc);
    if (hit) { float hb = clamp(1. - exp(-zb / 13000.), 0., 1.); T = mix(bt, mix(G(.66), uBot - .1, smoothstep(.5, .97, hb)), hb); emit = be; ecol = bc; }
  }

  /* ---- the Eiffel Tower beacon: one rotating beam, and a flash when it sweeps over the plane ---- */
  float beamHit = 0.;
  if (gnd && uCity > .5) {
    vec2 top = vec2((98100. - uTravel) * F / 4300. + .5 * asp, (324. - uH) * F / 4300. + uHorizon);
    if (top.x > -.6 && top.x < asp + .6) {
      float th = uTime * 1.1;
      float sa = sin(th), ca = cos(th);
      vec2 dir = normalize(vec2(sa, .1 + .05 * abs(ca)));
      float len = .06 + 1.7 * abs(sa);
      vec2 rel = p - top; float al = dot(rel, dir), pe = abs(rel.x * dir.y - rel.y * dir.x);
      float wdt = .003 + al * .03;
      if (al > 0. && al < len) T = mix(T, uHi + .3, exp(-pe * pe / (wdt * wdt)) * (1. - al / len) * (ca > 0. ? .6 : .35));
      beamHit = pow(max(cos(th), 0.), 30.);                                              /* the beam points at us */
      T += beamHit * .35 * exp(-length(p - top) * 2.5);
    }
  }

  /* ---- sea of clouds (never moves while visible) and fog (we fly through it) ---- */
  float e = (fbm3(vec2(p.x * 2.2 + uTime * .05 + uFlightX, 7.)) - .5) * .16;
  float tw = max(0., fbm3(vec2(p.x * 1.1 + 31. + uTime * .025 + uFlightX * .5, 2.)) - .5) * .8;
  float msc = smoothstep(uSea + e + tw + .03, uSea + e + tw - .03, ry);
  if (msc > 0.) {
    vec2 q = p * 2.2 + vec2(uTime * .06 + uFlightX, 0.);
    float n = fbm(q), nl = fbm(q + vec2(0., -.05));
    float lt = clamp((n - nl) * 4. + .5, .2, 1.);
    float tc = mix(uLo, uHi, clamp(n * 1.2 - .1, 0., 1.) * .55 + lt * .45);
    if (uContrail.y > .01) {                                                         /* the contrail's shadow on the clouds */
      vec2 rel = p - vec2(cX - .45, .17 - uContrail.x * .02);
      float s = -dot(rel, cDir), pr = dot(rel, cN) * 1.8;                             /* flattened: it lies on the cloud tops */
      if (s > .05) { float wd = .008 + s * .035; tc -= exp(-pr * pr / (wd * wd)) * exp(-s * .6) * .3 * uContrail.y; }
    }
    T = mix(T, tc, msc);
  }
  float fogM = 0.;
  if (uFog > 0.) {
    /* banks of cloud scrolling past, tighter and tighter */
    float nfog = fbm(p * vec2(1.05, 1.45) + vec2(uTime * .07 + uFlightX * 1.6, uOffY * 3.4));
    fogM = clamp((uFog * 1.4 - nfog * .95 - .05) / .3, 0., 1.);
    /* we enter the cloud from the side it is on: from the top when climbing, from the bottom when descending */
    float gy = uFogDir > 0. ? ry : 1. - ry;
    fogM *= smoothstep(1.2 - uFog * 1.55, 1.45 - uFog * 1.55, gy + (nfog - .5) * .45);
    float tf = mix(uLo, uHi, .56 + (fbm(p * vec2(1.2, 2.) + vec2(uTime * .09 + uFlightX * 1.6, uOffY * 1.4)) - .5) * .5);
    /* in the cloud, every strobe flash lights up the fog around the wing tip, and a little of everything: that is why
       pilots may switch them off in clouds, they dazzle. (The strobe sits near the wing tip: navUv, computed below.) */
    if (uStrobe > 0.) {
      vec2 tip = vec2((.5 - .4874 * uWingS / asp) * asp, .42 - .0721 * uWingS);
      tf = mix(tf, .97, uStrobe * (.22 + .78 * exp(-length(p - tip) * 2.4)));
    }
    T = mix(T, tf, fogM);
  }
  float m = max(msc, fogM);
  T += uFlash;
  vec3 col = pal(T, b);
  float sb = clamp(starB * (1. - m), 0., 1.);
  if (sb > .01) col = mix(col, vec3(.88, .92, 1.), sb);
  if (emit * (1. - m) > .5) col = ecol;

  /* ---- the left wing, in 3D, projected with the same camera ----
     aircraft frame (metres): x forward (to the right of the screen), y up, z outwards.
     Sweep ~25°, dihedral ~5°, chord 6 m at the root and 1.5 m at the tip, half-span 17 m. */
  float wx = (uv.x - .5) * asp / uWingS, wy = (uv.y - .42) / uWingS;
  const float LE0 = 1., LEK = .465, TE0 = -5., TEK = .2, Y0 = -2.5, DH = .087, SPAN = 17.;
  float tipLE = LE0 - SPAN * LEK, tipTE = TE0 - SPAN * TEK, tipY = Y0 + SPAN * DH;
  float zw = SPAN + .15, xw = wx * zw / F, yw = wy * zw / F, wu = (yw - tipY) / 2.4;
  if (wu > 0. && wu < 1.) {                                                              /* winglet */
    float le = tipLE - 1.5 * wu, te = le - mix(tipLE - tipTE, .7, wu);
    if (xw < le && xw > te) col = pal(mix(uWing.x, uWing.y, .3 + wu * .3 + (le - xw) * .08), b);
  }
  float den = wy - DH * F;
  if (den < 0.) {
    float z = Y0 * F / den;
    if (z > 0. && z < SPAN) {
      float x = wx * z / F, le = LE0 - z * LEK, te = TE0 - z * TEK, ch = (le - x) / (le - te);
      float lw = .035 * z / 6.;
      if (ch >= 0. && ch <= 1.) {
        float wt = .72 - ch * .26 + z / SPAN * .12;
        if (ch < .03) wt = .98;                                                          /* leading edge */
        else if (abs(ch - .095) < lw * .5 && z > 2.5) wt -= .2;                           /* slats */
        if (ch > .1 && ch < .62 && fract(z / 1.6) < lw * 1.2) wt -= .08;
        if (abs(ch - .2) < lw * .5 || abs(ch - .6) < lw * .5) wt -= .06;
        if (ch > .62 && ch < .73 && z < 11.5 && fract(z / 2.2) < lw * 1.5) wt -= .1;     /* spoilers */
        if (ch > .73) wt -= .1;                                                          /* flaps and aileron */
        if (abs(ch - .73) < lw * .6) wt = .12;
        if (ch > .73 && abs(z - 11.5) < lw * 3.) wt = .14;
        if (z < 6.5 && (abs(ch - .26) < lw * .4 || abs(ch - .5) < lw * .4)) wt = .2;
        if (ch > .965) wt = .2;
        wt += (1. - smoothstep(0., 1.3, abs(z - (3. + uGlint * 40.) + ch * 2.))) * .26 * clamp(uGlow * 2., 0., 1.);   /* sun glint */
        wt += beamHit * .35;                                                              /* the beacon sweeps over the wing */
        col = pal(mix(uWing.x, uWing.y, wt), b);
      }
    }
  }
  /* red navigation light (steady) and white strobe: sharp dots, as seen from afar */
  vec2 navUv = vec2(.5 + tipLE * F / SPAN * uWingS / asp, .42 + tipY * F / SPAN * uWingS);
  float dn = length(fc - navUv * uRes);
  if (dn < 1.1) col = vec3(1., .26, .2);
  else if (dn < 2.1 && uNight > .3) col = mix(col, vec3(1., .26, .2), .45);
  if (uStrobe > 0.) {
    vec2 stUv = vec2(.5 + (tipLE - 2.2) * F / zw * uWingS / asp, .42 + (tipY + 2.4) * F / zw * uWingS);
    float ds = length(fc - stUv * uRes);
    if (ds < 1.2) col = mix(col, vec3(1.), uStrobe);
    else if (ds < 2.3) col = mix(col, vec3(1.), .5 * uStrobe);
  }
  o = vec4(col, 1.);
}
