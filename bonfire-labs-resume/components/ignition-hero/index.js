// Ignition Hero — public API.
//
//   mount(el, { name, role?, tagline?, markUrl?, onComplete?, forcePlay? })
//   prefetch({ markUrl? })
//
// Plays once per session (sessionStorage 'ignition.played'). Reduced motion
// and replay both go straight to the resting state with a 200ms fade.

import { Timeline, easeInOutCubic, easeOutQuart, easeOutQuad } from './timeline.js';
import { SEED }                                                from './rng.js';
import { buildStrokePath, rasterizeStroke }                    from './path.js';
import { createScene }                                         from './scene.js';

const SESSION_KEY = 'ignition.played';

// Telemetry — silent if absent.
function track(event, props){
  try { window.specimen?.track?.(event, props || {}); } catch(_){ /* never throw */ }
}

// Brand tokens read from the page's CSS custom properties at mount.
function readBrand(){
  const cs = getComputedStyle(document.documentElement);
  const get = (k, fb) => {
    const v = cs.getPropertyValue(k).trim();
    if (!v) track('hero.brand_token_missing', { token: k });
    return v || fb;
  };
  return {
    bg:          get('--brand-bg',          '#0A0908'),
    ink:         get('--brand-ink',         '#1A1612'),
    text:        get('--brand-text',        '#E8E0D4'),
    muted:       get('--brand-muted',       '#6B5640'),
    mutedAlt:    get('--brand-muted-alt',   '#3D3328'),
    accent:      get('--brand-accent',      '#B8804A'),
    fontDisplay: get('--brand-font-display', 'Georgia, serif'),
    fontMono:    get('--brand-font-mono',    'JetBrains Mono, ui-monospace, monospace'),
  };
}

// Async font readiness with hard timeout.
async function ensureFonts(brand){
  const t0 = performance.now();
  if (!('fonts' in document)){
    track('hero.font_api_unavailable');
    return { ms: 0, fallback: true };
  }
  let timedOut = false;
  const timeout = new Promise(res => setTimeout(() => { timedOut = true; res(); }, 1500));
  try {
    await Promise.race([
      Promise.all([
        document.fonts.ready,
        document.fonts.load(`84px ${brand.fontDisplay}`),
      ]),
      timeout,
    ]);
  } catch(_){ /* swallow — proceed with fallback */ }
  const ms = Math.round(performance.now() - t0);
  if (timedOut) track('hero.font_load_timeout', { ms });
  track('hero.font_loaded', { ms, fallback_used: timedOut });
  return { ms, fallback: timedOut };
}

// Fetch the brand mark SVG. Returns sanitized SVG string or null.
async function loadMark(url){
  if (!url) return null;
  try {
    const r = await fetch(url, { credentials: 'same-origin' });
    if (!r.ok){ track('hero.mark_fetch_failed', { status: r.status }); return null; }
    const txt = await r.text();
    // Minimal sanitization: drop scripts. SVGs from same-origin trusted sources.
    return txt.replace(/<script[\s\S]*?<\/script>/gi, '').trim();
  } catch(err){
    track('hero.mark_fetch_failed', { message: String(err && err.message) });
    return null;
  }
}

export async function prefetch({ markUrl } = {}){
  const url = markUrl || './brand/mark.svg';
  try { await fetch(url, { credentials: 'same-origin' }); } catch(_){}
}

export function mount(host, opts = {}){
  if (!host) throw new Error('ignition-hero: host element missing');
  const {
    name,
    role     = '',
    tagline  = '',
    markUrl  = './brand/mark.svg',
    onComplete,
    forcePlay = false,
  } = opts;
  if (!name) throw new Error('ignition-hero: opts.name is required');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const alreadyPlayed = !forcePlay && sessionStorage.getItem(SESSION_KEY) === '1';
  const skipReason = reduceMotion ? 'reduced_motion'
                   : alreadyPlayed ? 'already_played'
                   : null;

  const brand = readBrand();

  // ── DOM scaffold ──────────────────────────────────────────────
  host.classList.add('ignition-hero');
  host.setAttribute('aria-label', 'Animated introduction');
  host.innerHTML = `
    <canvas class="ih-canvas" aria-hidden="true"></canvas>
    <div class="ih-rest" role="banner">
      <div class="ih-mark" data-brand-mark></div>
      <p class="ih-role"></p>
      <p class="ih-tag"></p>
    </div>
    <noscript>
      <img class="ih-noscript" src="./components/ignition-hero/fallback.svg" alt="${escAttr(name)}">
    </noscript>
  `;
  const canvas = host.querySelector('.ih-canvas');
  const rest   = host.querySelector('.ih-rest');
  const mark   = host.querySelector('[data-brand-mark]');
  const roleEl = host.querySelector('.ih-role');
  const tagEl  = host.querySelector('.ih-tag');
  roleEl.textContent = role;
  tagEl.textContent  = tagline;

  let webgl = 'webgl2';
  let scene = null;
  let tl    = null;
  let destroyed = false;

  function settle(){
    // Resting state via WAAPI fade; survives reduced-motion path.
    rest.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
    );
  }

  function complete(){
    sessionStorage.setItem(SESSION_KEY, '1');
    track('hero.completed', { duration_ms: tl ? Math.round(tl.t) : 0 });
    if (onComplete) try { onComplete(); } catch(_){}
  }

  // ── EARLY EXIT: skip path ─────────────────────────────────────
  if (skipReason){
    canvas.style.display = 'none';
    loadMark(markUrl).then(svg => { if (svg) mark.innerHTML = svg; });
    track('hero.mounted',  { reduced_motion: reduceMotion, already_played: alreadyPlayed, webgl });
    track('hero.skipped',  { reason: skipReason });
    settle();
    queueMicrotask(complete);
    return { destroy(){ destroyed = true; host.innerHTML = ''; } };
  }

  // ── FULL PATH: WebGL + timeline ───────────────────────────────
  (async () => {
    // Fonts first — geometry depends on measureText.
    await ensureFonts(brand);
    if (destroyed) return;

    // Sizing
    const rect = host.getBoundingClientRect();
    const W = Math.max(1, Math.round(rect.width));
    const H = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    // Stroke geometry + raster
    const fontSize = Math.max(48, Math.min(140, Math.round(H * 0.22)));
    const path = buildStrokePath(name, brand.fontDisplay, fontSize, W, H, SEED);
    let strokeCanvas = rasterizeStroke(path, W, H, dpr, 0);

    // Try WebGL2
    try {
      scene = createScene({ canvas, brand, strokeCanvas, dpr, noiseSeed: SEED });
    } catch(err){
      webgl = 'none';
      track('hero.webgl_unavailable', { message: String(err && err.message) });
      track('hero.mounted', { reduced_motion: false, already_played: false, webgl });
      canvas.style.display = 'none';
      loadMark(markUrl).then(svg => { if (svg) mark.innerHTML = svg; });
      settle();
      queueMicrotask(complete);
      return;
    }

    scene.resize(W, H, dpr);

    // Mark fetch — non-blocking, may resolve during burn.
    loadMark(markUrl).then(svg => { if (svg) mark.innerHTML = svg; });

    track('hero.mounted', { reduced_motion: false, already_played: false, webgl });

    // Tail (right end) of stroke, in uv-space — for ignition flash position.
    const tail = path.points[path.points.length - 1];
    const flashUv = tail ? [tail.x / W, 1 - (tail.y / H)] : [0.5, 0.5];

    // Live state for the renderer — read by the rAF loop only.
    const state = {
      time: 0,
      drawProgress: 0,
      burnProgress: 0,
      flash: 0,
      flashUv,
    };

    // Re-rasterize the stroke as it draws in. We update at most every ~33ms
    // — calls the rasterizer with a new drawProgress and re-uploads the
    // texture. This gives the WebGL shader an accurate per-frame "drawn so
    // far" mask without per-pixel JS work.
    let lastRasterMs = -100;
    const RASTER_INTERVAL = 33;

    function maybeUpdateStroke(t_ms, draw){
      if (t_ms - lastRasterMs < RASTER_INTERVAL && draw < 1.0) return;
      lastRasterMs = t_ms;
      const c = rasterizeStroke(path, W, H, dpr, draw);
      strokeCanvas = c;
      scene.uploadStroke(c);
    }

    // ── TIMELINE ─────────────────────────────────────────────
    tl = new Timeline()
      // Stage already painted by clear color; nothing to do at t=0.
      .at(200, () => { state.time = 0; })
      .range(200, 2400, p => {
        state.drawProgress = p;
        maybeUpdateStroke(performance.now(), p);
      }, easeInOutCubic)
      // Hold — 300ms. Critical reading frame.
      .at(2400, () => { state.drawProgress = 1; maybeUpdateStroke(performance.now(), 1); })
      // Ignition flash — 1 frame
      .at(2700, () => { state.flash = 1; setTimeout(() => state.flash = 0, 32); })
      // Burn travels right→left
      .range(2700, 5700, p => {
        state.burnProgress = p;
        // Time uniform in seconds since ignition — used for embers/smoke.
        state.time = (performance.now() - igniteStart) / 1000;
      }, easeOutQuart)
      // Burn complete — embers fade (smoke continues a bit longer)
      .range(5700, 6300, p => {
        state.time = (performance.now() - igniteStart) / 1000;
        state.burnProgress = 1;
      }, easeOutQuad)
      // Brand reveal via WAAPI (5900–7300)
      .at(5900, () => {
        rest.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 1400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
        );
      })
      // Cleanup
      .at(7400, () => {
        complete();
        // Keep the canvas around for the resting state — but stop the rAF
        // and release WebGL once the reveal is settled.
        cancelAnimationFrame(rafId);
        if (scene) scene.destroy();
      });

    let igniteStart = 0;
    tl.at(2700, () => { igniteStart = performance.now(); });

    // rAF render loop — the timeline drives uniforms; we only render.
    let rafId = 0;
    const renderLoop = () => {
      if (destroyed) return;
      scene.render(state);
      rafId = requestAnimationFrame(renderLoop);
    };
    rafId = requestAnimationFrame(renderLoop);

    // Visibility — pause when tab is backgrounded. Don't burn while invisible.
    const onVisibility = () => {
      if (document.hidden){ tl.pause(); cancelAnimationFrame(rafId); }
      else                { tl.resume(); rafId = requestAnimationFrame(renderLoop); }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Context loss — try one restore; otherwise jump to resting state.
    canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      track('hero.context_lost');
      tl.cancel();
      cancelAnimationFrame(rafId);
      // Show resting state.
      settle();
      complete();
    });

    // Resize — debounced, re-rasterize & re-upload.
    let resizeT = 0;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        const r = host.getBoundingClientRect();
        const w = Math.max(1, Math.round(r.width));
        const h = Math.max(1, Math.round(r.height));
        const d = Math.min(2, window.devicePixelRatio || 1);
        if (scene) scene.resize(w, h, d);
        // Rebuild geometry only on substantial size delta to avoid jank.
      }, 150);
    };
    window.addEventListener('resize', onResize);

    // Pagehide — release everything.
    const onPagehide = () => { destroy(); };
    window.addEventListener('pagehide', onPagehide, { once: true });

    // Public destroy
    function destroy(){
      destroyed = true;
      try { tl?.cancel(); } catch(_){}
      cancelAnimationFrame(rafId);
      try { scene?.destroy(); } catch(_){}
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pagehide', onPagehide);
      host.innerHTML = '';
    }
    api.destroy = destroy;

    // Frame-budget sampling (best effort) — reports p95 across the run.
    if ('PerformanceObserver' in window){
      try {
        const samples = [];
        const po = new PerformanceObserver((list) => {
          for (const e of list.getEntries()){
            if (e.entryType === 'longtask') samples.push(e.duration);
          }
        });
        po.observe({ entryTypes: ['longtask'] });
        setTimeout(() => {
          po.disconnect();
          if (samples.length){
            samples.sort((a,b)=>a-b);
            const p95 = samples[Math.floor(samples.length * 0.95)] || samples[samples.length-1];
            track('hero.frame_budget_violation', { p95_ms: Math.round(p95), sample_count: samples.length });
          }
        }, 8000);
      } catch(_){}
    }

    tl.start();
  })().catch(err => {
    track('hero.error', { code: 'mount_failed', message: String(err && err.message) });
    settle();
    queueMicrotask(complete);
  });

  const api = {
    destroy(){ destroyed = true; host.innerHTML = ''; },
  };
  return api;
}

function escAttr(s){
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
