// WebGL2 scene — fullscreen quad, single fragment shader.
// Shader source is mirrored from ./shaders/*.{vert,frag} as template
// strings here. The on-disk files are the source of truth; the inline
// copy lets us ship without a build step and stay clear of CSP rules
// against fetched shaders.
//
// Public:
//   createScene({ canvas, brand, strokeCanvas, noiseTex, dpr })
//     → { setUniforms, render, resize, destroy }

import { buildNoiseTexture } from './path.js';

// ─── Inline shaders (mirror of ./shaders/*) ────────────────────────────────
const VERT_SRC = `#version 300 es
out vec2 v_uv;
void main(){
  vec2 p = vec2((gl_VertexID == 1) ? 3.0 : -1.0,
                (gl_VertexID == 2) ? 3.0 : -1.0);
  v_uv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
uniform float u_time;
uniform float u_burnProgress;
uniform float u_drawProgress;
uniform vec2  u_resolution;
uniform vec3  u_brandBg;
uniform vec3  u_brandInk;
uniform float u_flash;
uniform vec2  u_flashUv;
uniform sampler2D u_strokeTex;
uniform sampler2D u_noise;
in  vec2 v_uv;
out vec4 frag;
const vec3 FIRE_CORE = vec3(1.00, 0.96, 0.78);
const vec3 FIRE_MID  = vec3(1.00, 0.62, 0.20);
const vec3 FIRE_TAIL = vec3(0.86, 0.22, 0.08);
const vec3 SMOKE_COL = vec3(0.71, 0.66, 0.62);
float fbm(vec2 p){
  float v=0.0,a=0.5; vec2 q=p;
  for (int i=0;i<4;i++){ v += a*texture(u_noise,q*0.5).r; q=q*2.03+0.137; a*=0.5; }
  return v;
}
void main(){
  vec2 uv = v_uv;
  vec4 stroke = texture(u_strokeTex, uv);
  float ink   = stroke.r;
  float pathU = stroke.g;
  float halo  = stroke.a;
  float burnFront = 1.0 - u_burnProgress;
  float burnedMask = smoothstep(burnFront - 0.012, burnFront + 0.012, pathU);
  float visibleInk = ink * (1.0 - burnedMask);
  visibleInk *= step(pathU, u_drawProgress + 0.001);
  vec3 col = u_brandBg;
  col = mix(col, u_brandInk, visibleInk * 0.92);
  float dist = abs(pathU - burnFront);
  float onPath = step(0.001, halo);
  float pathHeat = exp(-pow(dist / 0.045, 2.0)) * onPath * step(pathU, u_drawProgress + 0.001);
  vec3 fire = mix(FIRE_TAIL, FIRE_MID, pathHeat);
  fire = mix(fire, FIRE_CORE, smoothstep(0.55, 1.0, pathHeat));
  col += fire * pathHeat * 1.4;
  vec2 emberUv = uv * vec2(2.6, 1.4) + vec2(u_time * 0.06, -u_time * 0.22);
  float n1 = texture(u_noise, emberUv).r;
  float n2 = texture(u_noise, emberUv * 2.13 + 0.31).g;
  float emberSeed = n1 * n2;
  float emberGate = smoothstep(0.05, 0.0, dist) * onPath;
  float lifted = clamp((halo - 0.02) * 6.0, 0.0, 1.0);
  emberGate += lifted * step(0.93, emberSeed) * (0.6 - dist * 6.0);
  emberGate  = clamp(emberGate, 0.0, 1.0);
  float emberMask = step(0.92, emberSeed) * emberGate;
  float emberLife = fract(u_time * 0.5 + n1 * 4.0);
  vec3 emberCol = mix(FIRE_CORE, FIRE_TAIL, emberLife);
  col += emberCol * emberMask * (1.0 - emberLife) * 1.3;
  vec2 belowUv = uv + vec2(0.0, 0.06);
  vec4 strokeBelow = texture(u_strokeTex, belowUv);
  float burnedBelow = smoothstep(burnFront - 0.012, burnFront + 0.012, strokeBelow.g);
  float smokeSrc = burnedBelow * strokeBelow.a;
  vec2 smokeUv = uv * vec2(1.6, 1.0) + vec2(u_time * 0.04, -u_time * 0.16);
  float smk = fbm(smokeUv);
  float smokeMask = smoothstep(0.45, 0.95, smk) * smokeSrc;
  smokeMask *= clamp(uv.y * 1.4 + 0.05, 0.0, 1.0);
  col = mix(col, SMOKE_COL, smokeMask * 0.55);
  if (u_flash > 0.001){
    vec2 d = (uv - u_flashUv) * vec2(u_resolution.x / u_resolution.y, 1.0);
    float r = length(d);
    float bloom = exp(-r * 14.0) * u_flash;
    col += FIRE_CORE * bloom * 1.8;
  }
  frag = vec4(col, 1.0);
}`;

// ─── Helpers ───────────────────────────────────────────────────────────────
function compile(gl, type, src){
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
    const msg = gl.getShaderInfoLog(sh) || 'shader compile failed';
    gl.deleteShader(sh);
    throw new Error(msg);
  }
  return sh;
}
function link(gl, vs, fs){
  const p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)){
    const msg = gl.getProgramInfoLog(p) || 'program link failed';
    gl.deleteProgram(p); throw new Error(msg);
  }
  return p;
}
function hexToRgb(hex){
  const s = (hex || '').replace('#','').trim();
  if (!/^([0-9a-f]{6}|[0-9a-f]{3})$/i.test(s)) return [0, 0, 0];
  const full = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
  return [
    parseInt(full.slice(0,2), 16) / 255,
    parseInt(full.slice(2,4), 16) / 255,
    parseInt(full.slice(4,6), 16) / 255,
  ];
}

export function createScene({ canvas, brand, strokeCanvas, dpr, noiseSeed }){
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
    desynchronized: true,
  });
  if (!gl) throw new Error('webgl2 unavailable');

  // Compile + link
  const vs = compile(gl, gl.VERTEX_SHADER,   VERT_SRC);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  const prog = link(gl, vs, fs);
  gl.deleteShader(vs); gl.deleteShader(fs);

  // Uniform locations
  const U = {
    time:         gl.getUniformLocation(prog, 'u_time'),
    burnProgress: gl.getUniformLocation(prog, 'u_burnProgress'),
    drawProgress: gl.getUniformLocation(prog, 'u_drawProgress'),
    resolution:   gl.getUniformLocation(prog, 'u_resolution'),
    brandBg:      gl.getUniformLocation(prog, 'u_brandBg'),
    brandInk:     gl.getUniformLocation(prog, 'u_brandInk'),
    flash:        gl.getUniformLocation(prog, 'u_flash'),
    flashUv:      gl.getUniformLocation(prog, 'u_flashUv'),
    strokeTex:    gl.getUniformLocation(prog, 'u_strokeTex'),
    noise:        gl.getUniformLocation(prog, 'u_noise'),
  };

  // Stroke texture
  const strokeTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, strokeTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, strokeCanvas);

  // Noise texture (CPU-generated, deterministic, repeating)
  const noiseTex = gl.createTexture();
  const noise = buildNoiseTexture(noiseSeed);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, noiseTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, noise.width, noise.height, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, noise.data);

  const bgRgb  = hexToRgb(brand.bg);
  const inkRgb = hexToRgb(brand.ink);

  // No vertex buffer needed — we use gl_VertexID in vertex shader.
  const vao = gl.createVertexArray();

  function setBrand(b){
    Object.assign(brand, b);
    const bg  = hexToRgb(brand.bg);
    const ink = hexToRgb(brand.ink);
    bgRgb[0]=bg[0]; bgRgb[1]=bg[1]; bgRgb[2]=bg[2];
    inkRgb[0]=ink[0]; inkRgb[1]=ink[1]; inkRgb[2]=ink[2];
  }

  function uploadStroke(srcCanvas){
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, strokeTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);
  }

  function resize(W, H, nextDpr){
    dpr = nextDpr;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function render(state){
    // state: { time, burnProgress, drawProgress, flash, flashUv:[u,v] }
    gl.useProgram(prog);
    gl.bindVertexArray(vao);

    gl.uniform1f(U.time,         state.time);
    gl.uniform1f(U.burnProgress, state.burnProgress);
    gl.uniform1f(U.drawProgress, state.drawProgress);
    gl.uniform2f(U.resolution,   canvas.width, canvas.height);
    gl.uniform3f(U.brandBg,      bgRgb[0], bgRgb[1], bgRgb[2]);
    gl.uniform3f(U.brandInk,     inkRgb[0], inkRgb[1], inkRgb[2]);
    gl.uniform1f(U.flash,        state.flash || 0);
    gl.uniform2f(U.flashUv,      state.flashUv ? state.flashUv[0] : 0.5,
                                  state.flashUv ? state.flashUv[1] : 0.5);

    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, strokeTex);
    gl.uniform1i(U.strokeTex, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, noiseTex);
    gl.uniform1i(U.noise, 1);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function destroy(){
    gl.deleteTexture(strokeTex);
    gl.deleteTexture(noiseTex);
    gl.deleteProgram(prog);
    gl.deleteVertexArray(vao);
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
  }

  return { gl, render, resize, destroy, uploadStroke, setBrand };
}
