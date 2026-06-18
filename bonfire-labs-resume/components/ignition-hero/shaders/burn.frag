#version 300 es
precision highp float;

uniform float u_time;          // seconds since ignition (0 before)
uniform float u_burnProgress;  // 0..1 (eased)
uniform float u_drawProgress;  // 0..1 — how much of the stroke is rasterized
uniform vec2  u_resolution;    // CSS px
uniform vec3  u_brandBg;
uniform vec3  u_brandInk;
uniform float u_flash;         // 0..1 single-frame ignition bloom
uniform vec2  u_flashUv;       // tail position in uv space
uniform sampler2D u_strokeTex;
uniform sampler2D u_noise;

in  vec2 v_uv;
out vec4 frag;

const vec3 FIRE_CORE = vec3(1.00, 0.96, 0.78);  // ~6500K
const vec3 FIRE_MID  = vec3(1.00, 0.62, 0.20);  // ~2200K
const vec3 FIRE_TAIL = vec3(0.86, 0.22, 0.08);  // ~1600K
const vec3 SMOKE_COL = vec3(0.71, 0.66, 0.62);

float fbm(vec2 p){
  float v = 0.0; float a = 0.5; vec2 q = p;
  for (int i = 0; i < 4; i++){
    v += a * texture(u_noise, q * 0.5).r;
    q  = q * 2.03 + 0.137;
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = v_uv;
  vec4 stroke = texture(u_strokeTex, uv);
  float ink   = stroke.r;
  float pathU = stroke.g;
  float halo  = stroke.a;

  // Burn front travels right→left. PathU is 0 at start (left), 1 at tail (right).
  // Burned region is pathU > burnFront.
  float burnFront = 1.0 - u_burnProgress;
  float burnedMask = smoothstep(burnFront - 0.012, burnFront + 0.012, pathU);

  // Erase the burned ink completely.
  float visibleInk = ink * (1.0 - burnedMask);
  // Only show ink where the stroke has actually been drawn yet.
  visibleInk *= step(pathU, u_drawProgress + 0.001);

  // Base composite: bg + ink
  vec3 col = u_brandBg;
  col = mix(col, u_brandInk, visibleInk * 0.92);

  // ── Heat halo at burn front, on the path only ───────────────
  float dist = abs(pathU - burnFront);
  float onPath = step(0.001, halo);
  // Bell curve in pathU around burnFront, restricted to actually-drawn region.
  float pathHeat = exp(-pow(dist / 0.045, 2.0)) * onPath
                  * step(pathU, u_drawProgress + 0.001);
  vec3 fire = mix(FIRE_TAIL, FIRE_MID, pathHeat);
  fire = mix(fire, FIRE_CORE, smoothstep(0.55, 1.0, pathHeat));
  col += fire * pathHeat * 1.4;

  // ── Embers ──────────────────────────────────────────────────
  // Sample two octaves of noise drifting up; threshold sparse.
  vec2 emberUv = uv * vec2(2.6, 1.4) + vec2(u_time * 0.06, -u_time * 0.22);
  float n1 = texture(u_noise, emberUv).r;
  float n2 = texture(u_noise, emberUv * 2.13 + 0.31).g;
  float emberSeed = n1 * n2;
  // Spawn density gates: only near the burn front and only within the
  // hero's vertical band (driven by halo proximity below).
  float emberGate = smoothstep(0.05, 0.0, dist) * onPath;
  // Lift them above the stroke so they trail upward.
  float lifted = clamp((halo - 0.02) * 6.0, 0.0, 1.0);
  emberGate += lifted * step(0.93, emberSeed) * (0.6 - dist * 6.0);
  emberGate  = clamp(emberGate, 0.0, 1.0);
  float emberMask = step(0.92, emberSeed) * emberGate;
  float emberLife = fract(u_time * 0.5 + n1 * 4.0);
  vec3 emberCol = mix(FIRE_CORE, FIRE_TAIL, emberLife);
  col += emberCol * emberMask * (1.0 - emberLife) * 1.3;

  // ── Smoke ───────────────────────────────────────────────────
  // Sample halo a fixed distance below current uv; if there's stroke
  // material there but it's already burned, emit smoke rising upward.
  vec2 belowUv = uv + vec2(0.0, 0.06);
  vec4 strokeBelow = texture(u_strokeTex, belowUv);
  float burnedBelow = smoothstep(burnFront - 0.012, burnFront + 0.012, strokeBelow.g);
  float smokeSrc = burnedBelow * strokeBelow.a;
  vec2 smokeUv = uv * vec2(1.6, 1.0) + vec2(u_time * 0.04, -u_time * 0.16);
  float smk = fbm(smokeUv);
  float smokeMask = smoothstep(0.45, 0.95, smk) * smokeSrc;
  // Falls off as it rises (uv.y near 0).
  smokeMask *= clamp(uv.y * 1.4 + 0.05, 0.0, 1.0);
  col = mix(col, SMOKE_COL, smokeMask * 0.55);

  // ── Ignition flash (1 frame, additive radial bloom at tail) ─
  if (u_flash > 0.001){
    vec2 d = (uv - u_flashUv) * vec2(u_resolution.x / u_resolution.y, 1.0);
    float r = length(d);
    float bloom = exp(-r * 14.0) * u_flash;
    col += FIRE_CORE * bloom * 1.8;
  }

  frag = vec4(col, 1.0);
}
