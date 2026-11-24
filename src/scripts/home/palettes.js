/*
 * One ladder of 8 tones per scene, and everything is drawn with it (sky, clouds, ground, buildings, wing, pictograms).
 * Built in OKLCH: even lightness steps, saturation falling off towards black and towards white.
 * Tones are always mixed before dithering, never colours: no checkerboard between two distant colours.
 * The lightest tone (index 7) is reserved for the sun disk.
 */
import { oklch } from './util.js';

const ladder = (L, C, H) => L.map((v, i) => oklch(v, C[i], Array.isArray(H) ? H[i] : H));

export const PALETTES = {
  DAWN:      ladder([.14, .22, .30, .39, .49, .61, .75, .93], [.035, .06, .08, .09, .095, .10, .09, .045], [272, 272, 280, 300, 345, 25, 50, 75]),
  SUNRISE:   ladder([.18, .27, .36, .46, .57, .69, .82, .96], [.05, .08, .10, .10, .09, .09, .08, .04], [262, 262, 268, 290, 340, 30, 55, 80]),
  CLOUDDAWN: ladder([.42, .52, .61, .70, .78, .85, .91, .98], [.03, .035, .035, .03, .03, .025, .02, .01], [290, 295, 305, 320, 340, 10, 40, 70]),
  CLOUD:     ladder([.45, .55, .64, .72, .80, .87, .93, .99], [.03, .03, .028, .025, .02, .015, .01, .005], 258),
  CRUISE:    ladder([.14, .24, .34, .45, .56, .68, .81, .97], [.04, .08, .12, .15, .15, .12, .07, .015], 264),
  GOLD:      ladder([.18, .27, .37, .48, .60, .72, .84, .95], [.06, .09, .11, .13, .14, .13, .10, .05], [290, 310, 340, 10, 40, 58, 72, 85]),
  DUSK:      ladder([.15, .22, .30, .39, .48, .58, .69, .82], [.04, .06, .07, .07, .07, .06, .06, .05], [280, 285, 295, 310, 330, 350, 20, 45]),
  NIGHT:     ladder([.10, .16, .22, .29, .37, .47, .62, .90], [.02, .04, .06, .07, .07, .06, .045, .025], [265, 265, 266, 268, 270, 268, 258, 250]),
};
