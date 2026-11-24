/* Small maths helpers shared by the flight scene. */

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);

/** Mixes numbers or (nested) arrays of numbers. */
export const mixV = (a, b, t) => (Array.isArray(a) ? a.map((v, i) => mixV(v, b[i], t)) : lerp(a, b, t));

/**
 * Piecewise curve through [f, value] points, eased between points.
 * Values can be numbers or arrays. Outside the first and last points the curve is flat.
 */
export const curve = (points) => (f) => {
  let i = 0;
  while (i < points.length - 2 && f > points[i + 1][0]) i++;
  const [fa, va] = points[i], [fb, vb] = points[i + 1];
  return mixV(va, vb, smooth(clamp((f - fa) / (fb - fa))));
};

/** OKLCH to sRGB (0..1 per channel). */
export function oklch(L, C, H) {
  const hr = (H * Math.PI) / 180, A = C * Math.cos(hr), Bb = C * Math.sin(hr);
  const l = (L + 0.3963377774 * A + 0.2158037573 * Bb) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * Bb) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * Bb) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((x) => {
    x = clamp(x);
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  });
}
