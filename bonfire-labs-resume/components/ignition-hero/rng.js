// Deterministic RNG — mulberry32. QA captures frame N at this seed and
// asserts pixel-diff regressions. Do not swap algorithms without a re-bake
// of all reference images.

export const SEED = 0xB0FF12E; // "BONFIRE" — closest valid hex spelling

export function mulberry32(seed){
  let s = seed >>> 0;
  return function(){
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic helpers — all driven by a passed-in rng().
export const range  = (rng, a, b) => a + (b - a) * rng();
export const choose = (rng, arr)  => arr[(rng() * arr.length) | 0];
