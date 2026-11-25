/*
 * WebGL2 renderer in two passes:
 *   1. sky.frag.glsl computes one colour per cell into a small texture (gw × gh);
 *   2. blit.frag.glsl scales every cell up to a sharp square on screen (texelFetch), anchored top left.
 * Cell size as on Aria: about 480 cells across, and each cell is a whole number of device pixels, so squares stay sharp.
 */
import SKY_FS from './shaders/sky.frag.glsl?raw';

const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const BLIT_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex; uniform float uCell; uniform float uOffY; out vec4 o;
void main(){ o = texelFetch(uTex, ivec2(floor((gl_FragCoord.xy + vec2(0., uOffY)) / uCell)), 0); }`;

const UNIFORMS = ['uRes', 'uTime', 'uPal', 'uSea', 'uFog', 'uCover', 'uTop', 'uBot', 'uLo', 'uHi', 'uGlow', 'uRays', 'uStars',
  'uOffY', 'uFlash', 'uSun', 'uWing', 'uGround', 'uH', 'uTravel', 'uTilt', 'uHorizon', 'uNight', 'uCity', 'uStrobe', 'uWingS',
  'uBlink', 'uGlint', 'uRwy', 'uCalm', 'uCalmK', 'uMoon', 'uMoonL', 'uMilky', 'uMet', 'uMet2', 'uFogDir', 'uFlightX',
  'uHalo', 'uContrail', 'uNet', 'uBeam'];

/** Size of a cell: in device pixels (a whole number, so squares stay sharp) and in CSS pixels. Shared with the
 *  pixel-art drawn over the scene (pictograms, button glint, the window blind), so it uses the same grid. */
export function cellSize() {
  const w = innerWidth, hgt = innerHeight, dpr = Math.min(devicePixelRatio || 1, 3);
  const cellCss = Math.max(3, Math.round(Math.max(w, hgt * 1.4) / 480));
  const dev = Math.max(1, Math.round(cellCss * dpr));
  return { dev, css: dev / dpr, dpr };
}

/** Returns null when WebGL2 is not available (the page then falls back to a CSS gradient). */
export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const link = (fs) => {
    const pr = gl.createProgram();
    gl.attachShader(pr, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, compile(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(pr, 0, 'p'); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    return pr;
  };

  let sky, blit;
  try { sky = link(SKY_FS); blit = link(BLIT_FS); } catch (err) { console.error(err); return null; }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);   /* one big triangle */
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  UNIFORMS.forEach((k) => { U[k] = gl.getUniformLocation(sky, k); });
  const B = { tex: gl.getUniformLocation(blit, 'uTex'), cell: gl.getUniformLocation(blit, 'uCell'), off: gl.getUniformLocation(blit, 'uOffY') };
  const tex = gl.createTexture(), fbo = gl.createFramebuffer();
  const size = { gw: 1, gh: 1, cell: 3, devW: 1, devH: 1 };

  function resize() {
    const w = innerWidth, hgt = innerHeight, { dev, dpr } = cellSize();
    size.cell = dev;
    size.devW = Math.round(w * dpr); size.devH = Math.round(hgt * dpr);
    size.gw = Math.ceil(size.devW / size.cell); size.gh = Math.ceil(size.devH / size.cell);
    canvas.width = size.devW; canvas.height = size.devH;
    canvas.style.width = w + 'px'; canvas.style.height = hgt + 'px';
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size.gw, size.gh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** `set(gl, U)` sets the scene uniforms; the renderer handles the passes. */
  function draw(set) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, size.gw, size.gh); gl.useProgram(sky);
    gl.uniform2f(U.uRes, size.gw, size.gh);
    set(gl, U);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, size.devW, size.devH); gl.useProgram(blit);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(B.tex, 0); gl.uniform1f(B.cell, size.cell); gl.uniform1f(B.off, size.gh * size.cell - size.devH);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  resize();
  return { resize, draw, size };
}
