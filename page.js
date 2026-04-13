// page.js — shared JS for all project & archive pages
// Reads accent color from body[data-accent]
// Reads next-link color from #next-link[data-color]

(function () {

  // ── One-time cursor setup (persists across SPA navigations) ───────────────
  var cursor   = document.getElementById('cursor');
  var follower = document.getElementById('cursorFollower');
  var mx = window.innerWidth / 2, my = window.innerHeight / 2, fx = mx, fy = my;

  document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

  var _tickActive = true;

  // Called by router before navigating to index — stops tick so index physics takes over
  window._disablePageCursor = function () {
    _tickActive = false;
    // Both systems use style.left/top — no GSAP to clear, elements hold position naturally.
  };

  // Called by reinitPage when arriving at a project page
  window._enablePageCursor = function () {
    // Re-acquire elements — handles any edge case where refs went stale
    cursor   = document.getElementById('cursor');
    follower = document.getElementById('cursorFollower');
    _tickActive = true;
    // Snap follower physics to current mouse so there's no jump on arrival
    fx = mx; fy = my;
    // Clear morphed border-radius left by the index physics blob
    if (follower) follower.style.borderRadius = '';
  };

  (function tick() {
    if (_tickActive) {
      if (cursor)   { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; }
      if (follower) { fx += (mx - fx) * 0.08; fy += (my - fy) * 0.08;
                      follower.style.left = (fx - 40) + 'px'; follower.style.top = (fy - 40) + 'px'; }
    }
    requestAnimationFrame(tick);
  })();

  // ── Transition helpers (defined once, used by nav() and reinitPage) ───────

  function ptRandomColor() {
    let r, g, b;
    do {
      r = Math.round(180 + Math.random() * 75);
      g = Math.round(180 + Math.random() * 75);
      b = Math.round(180 + Math.random() * 75);
    } while (Math.max(r, g, b) - Math.min(r, g, b) < 65);
    return '#' + [r, g, b].map(c => Math.min(255, c).toString(16).padStart(2, '0')).join('');
  }

  function buildSplashEl() {
    const wrap    = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:99998;pointer-events:none;overflow:hidden;background:transparent;';
    const fills   = Array.from({length:4}, () => { const f = document.createElement('div'); f.className = 'pt-fill';   wrap.appendChild(f); return f; });
    const circles = Array.from({length:4}, () => { const c = document.createElement('div'); c.className = 'pt-circle'; wrap.appendChild(c); return c; });
    document.body.appendChild(wrap);
    return { wrap, fills, circles };
  }

  function spawnCornerArrows(color, entry) {
    const W = window.innerWidth, H = window.innerHeight, pad = 36;
    const mx = W / 2, my = H / 2;
    const defs = [
      { exit: { char:'↘', x:pad,   y:pad   }, entry: { char:'↖', x:pad,   y:pad   } },
      { exit: { char:'↙', x:W-pad, y:pad   }, entry: { char:'↗', x:W-pad, y:pad   } },
      { exit: { char:'↗', x:pad,   y:H-pad }, entry: { char:'↙', x:pad,   y:H-pad } },
      { exit: { char:'↖', x:W-pad, y:H-pad }, entry: { char:'↘', x:W-pad, y:H-pad } },
    ];
    defs.forEach(d => {
      const def = entry ? d.entry : d.exit;
      const el  = document.createElement('div');
      el.className = 'pt-arrow';
      el.textContent = def.char;
      el.style.color = color;
      if (entry) {
        el.style.left = mx + 'px'; el.style.top = my + 'px';
        el.style.transform = 'translate(-50%,-50%)';
        document.body.appendChild(el);
        requestAnimationFrame(() => {
          el.style.transform = `translate(calc(-50% + ${def.x - mx}px),calc(-50% + ${def.y - my}px))`;
        });
      } else {
        el.style.left = def.x + 'px'; el.style.top = def.y + 'px';
        el.style.transform = 'translate(-50%,-50%)';
        document.body.appendChild(el);
        requestAnimationFrame(() => {
          el.style.transform = `translate(calc(-50% + ${mx - def.x}px),calc(-50% + ${my - def.y}px))`;
        });
      }
      setTimeout(() => el.remove(), 700);
    });
  }

  const CLIP_PATHS = [
    'polygon(50% 50%,50% 0%,0% 0%,0% 50%)',
    'polygon(50% 50%,50% 0%,100% 0%,100% 50%)',
    'polygon(50% 50%,0% 50%,0% 100%,50% 100%)',
    'polygon(50% 50%,100% 50%,100% 100%,50% 100%)',
  ];

  // Exit animation → fetch new page → swap (music keeps playing)
  function nav(href, color) {
    const W = window.innerWidth, H = window.innerHeight;
    const cx = W / 2, cy = H / 2;
    const size = Math.max(W, H) * 1.3;
    const quadrants = [
      {x: W*0.25, y: H*0.25}, {x: W*0.75, y: H*0.25},
      {x: W*0.25, y: H*0.75}, {x: W*0.75, y: H*0.75},
    ];

    const colors = [ptRandomColor(), ptRandomColor(), ptRandomColor(), ptRandomColor()];
    sessionStorage.setItem('pt-colors', JSON.stringify(colors));

    spawnCornerArrows(colors[0], false);

    const { wrap, fills, circles } = buildSplashEl();
    wrap.style.pointerEvents = 'all';

    fills.forEach((f, i) => {
      f.style.cssText = 'position:absolute;inset:0;background:#fff;transform-origin:50% 50%;';
      f.style.clipPath = CLIP_PATHS[i];
      gsap.set(f, { scale: 0 });
    });

    circles.forEach((c, i) => {
      const col = colors[i];
      const dx = quadrants[i].x + (Math.random()-0.5)*50;
      const dy = quadrants[i].y + (Math.random()-0.5)*50;
      c.style.cssText = 'position:absolute;border-radius:50%;mix-blend-mode:multiply;';
      c.style.background = `radial-gradient(circle at center,${col} 0%,${col}dd 35%,${col}66 60%,transparent 80%)`;
      gsap.set(c, { width:size, height:size, x:cx-size/2, y:cy-size/2, scale:0 });
      c._dx = dx - size/2; c._dy = dy - size/2;
    });

    // Start fetching immediately — runs in parallel with the exit animation
    var fetchPromise = fetch(href).then(function (r) { return r.text(); });

    const tl = gsap.timeline({ onComplete() {
      if (window._spaNav) window._spaNav(href, fetchPromise);
      else window.location.href = href; // fallback if router not loaded
    }});
    tl.to(fills,   { scale:1, duration:0.18, stagger:0.015, ease:'power3.inOut' })
      .to(circles, { x:(i)=>circles[i]._dx, y:(i)=>circles[i]._dy, scale:1, duration:0.22, stagger:0.02, ease:'power3.out' }, '-=0.04');
  }

  // ── Lenis instance — shared between reinitPage calls ─────────────────────
  var lenis = null;
  var lenisRafStarted = false;

  window._destroyPageLenis = function () {
    if (lenis) { lenis.destroy(); lenis = null; }
  };

  // ── Per-page init (re-called after every SPA navigation) ─────────────────
  function reinitPage() {
    // Re-enable page cursor (router disables it before every swap)
    window._enablePageCursor();

    // Destroy previous Lenis before creating new one
    if (lenis) { lenis.destroy(); lenis = null; }

    var accent = document.body.dataset.accent || '#c8c2f5';

    // ── Entry reveal (runs when arriving via a page transition) ──────────
    (function entryReveal() {
      const stored = sessionStorage.getItem('pt-colors');
      if (!stored) return;
      sessionStorage.removeItem('pt-colors'); // consume so it doesn't replay on next reinit

      const colors = JSON.parse(stored);
      const W = window.innerWidth, H = window.innerHeight;
      const cx = W / 2, cy = H / 2;
      const size = Math.max(W, H) * 1.3;
      const quadrants = [
        {x: W*0.25, y: H*0.25}, {x: W*0.75, y: H*0.25},
        {x: W*0.25, y: H*0.75}, {x: W*0.75, y: H*0.75},
      ];

      const { wrap, fills, circles } = buildSplashEl();
      wrap.style.pointerEvents = 'all';

      fills.forEach((f, i) => {
        f.style.cssText = 'position:absolute;inset:0;background:#fff;transform-origin:50% 50%;';
        f.style.clipPath = CLIP_PATHS[i];
        gsap.set(f, { scale: 1 });
      });

      circles.forEach((c, i) => {
        const col = colors[i] || ptRandomColor();
        const dx = quadrants[i].x + (Math.random()-0.5)*50;
        const dy = quadrants[i].y + (Math.random()-0.5)*50;
        c.style.cssText = 'position:absolute;border-radius:50%;mix-blend-mode:multiply;';
        c.style.background = `radial-gradient(circle at center,${col} 0%,${col}dd 35%,${col}66 60%,transparent 80%)`;
        gsap.set(c, { width:size, height:size, x:dx-size/2, y:dy-size/2, scale:1 });
      });

      spawnCornerArrows(colors[0], true);

      const tl = gsap.timeline({ onComplete() { wrap.remove(); wrap.style.pointerEvents = 'none'; } });
      tl.to(wrap, { filter:'blur(28px)', duration:0.3, ease:'power2.inOut' })
        .to(wrap, { opacity:0, duration:0.45, ease:'power2.inOut' }, '+=0.02');
    })();

    // ── Lenis smooth scroll ───────────────────────────────────────────────
    lenis = new Lenis({ lerp: 0.08 });
    if (!lenisRafStarted) {
      lenisRafStarted = true;
      (function raf(t) { if (lenis) lenis.raf(t); requestAnimationFrame(raf); })(0);
    }

    // ── Navigation link wiring ────────────────────────────────────────────
    ['back-link', 'back-link2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', e => { e.preventDefault(); nav('index.html', accent); });
    });

    const nextLink = document.getElementById('next-link');
    if (nextLink) {
      nextLink.addEventListener('click', e => {
        e.preventDefault();
        nav(nextLink.getAttribute('href'), nextLink.dataset.color || accent);
      });
    }

    // ── Hero scroll: cover → contain, sticky below nav ───────────────────
    const heroEl  = document.querySelector('.p-hero');
    const heroImg = document.querySelector('.p-hero img');

    if (heroEl && heroImg) {
      let currentProgress = 0;

      const heroNavH  = (document.querySelector('.p-nav') || {}).offsetHeight || 73;
      const heroFrameH = window.innerHeight - heroNavH;

      const heroWrapper = document.createElement('div');
      heroWrapper.className = 'p-hero-wrapper';
      heroWrapper.style.cssText = 'position:relative; height:200vh;';
      heroEl.parentNode.insertBefore(heroWrapper, heroEl);
      heroWrapper.appendChild(heroEl);
      heroEl.style.cssText = `position:sticky; top:${heroNavH}px; height:${heroFrameH}px; overflow:hidden;`;

      heroImg.style.objectFit = 'fill';
      heroImg.style.objectPosition = '';

      const heroBadge = document.createElement('div');
      heroBadge.className = 'p-hero-badge';
      const _title = document.querySelector('.p-title');
      const _sub   = document.querySelector('.p-subtitle');
      heroBadge.innerHTML =
        (_title ? `<div class="p-hero-badge-title">${_title.textContent.trim()}</div>` : '') +
        (_sub   ? `<div class="p-hero-badge-sub">${_sub.textContent.trim()}</div>`   : '');
      heroEl.appendChild(heroBadge);

      function focalToXY(str) {
        const parts = (str || 'center center').split(' ');
        const m = { left: 0, center: 0.5, right: 1, top: 0, bottom: 1 };
        return [
          m[parts[0]] !== undefined ? m[parts[0]] : 0.5,
          m[parts[1]] !== undefined ? m[parts[1]] : 0.5,
        ];
      }

      function applyEffect(progress) {
        currentProgress = Math.min(1, Math.max(0, progress));
        if (!heroImg.naturalWidth) return;

        const iw = heroImg.naturalWidth;
        const ih = heroImg.naturalHeight;
        const cw = heroEl.offsetWidth;
        const ch = heroFrameH;

        const coverScale   = Math.max(cw / iw, ch / ih);
        const containScale = Math.min(cw / iw, ch / ih);
        const baseZoom     = parseFloat(heroImg.dataset.zoom || '1');
        const startScale   = coverScale * baseZoom;
        const scale        = startScale + (containScale - startScale) * currentProgress;

        const w = Math.round(iw * scale);
        const h = Math.round(ih * scale);

        const [fx, fy] = focalToXY(heroImg.dataset.focal || 'center top');
        let x = fx * cw - fx * w;
        let y = fy * ch - fy * h;
        if (w >= cw) x = Math.min(0, Math.max(cw - w, x));
        else         x = Math.min(cw - w, Math.max(0, x));
        if (h >= ch) y = Math.min(0, Math.max(ch - h, y));
        else         y = Math.min(ch - h, Math.max(0, y));

        heroImg.style.width     = w + 'px';
        heroImg.style.height    = h + 'px';
        heroImg.style.left      = x + 'px';
        heroImg.style.top       = y + 'px';
        heroImg.style.transform = '';

        heroBadge.style.opacity = Math.max(0, 1 - currentProgress * 2.5);
      }

      if (heroImg.complete && heroImg.naturalWidth) applyEffect(0);
      heroImg.addEventListener('load', () => applyEffect(currentProgress));
      window.addEventListener('resize', () => applyEffect(currentProgress), { passive: true });

      lenis.on('scroll', ({ scroll }) => { applyEffect(scroll / window.innerHeight); });

      heroEl._applyEffect = applyEffect;
      heroEl._getProgress = () => currentProgress;
    }

    // ── Tall image scroll reveal ──────────────────────────────────────────
    // RATIO_CLASSES / SPAN_CLASSES / setupTallImg are hoisted to reinitPage scope
    // so edit-mode wireImg can call setupTallImg on newly added images.
    const RATIO_CLASSES = ['ratio-16-9', 'ratio-4-3', 'ratio-1-1', 'ratio-3-4'];
    const SPAN_CLASSES  = ['wide', 'span-2'];

    function setupTallImg(img) {
        if (img.dataset.tallSetup) return;
        if (!img.naturalWidth || !img.naturalHeight) return;
        if (RATIO_CLASSES.some(c => img.classList.contains(c))) return;

        const displayW = img.offsetWidth;
        if (!displayW) return;

        const vh              = window.innerHeight;
        const naturalDisplayH = displayW * img.naturalHeight / img.naturalWidth;
        if (naturalDisplayH <= vh) return;

        img.dataset.tallSetup = '1';

        const navH  = (document.querySelector('.p-nav') || {}).offsetHeight || 73;
        const frameH = vh - navH;

        const outer = document.createElement('div');
        outer.className = 'tall-img-outer';
        outer.style.cssText = `height:${2 * vh}px; position:relative;`;
        SPAN_CLASSES.forEach(cls => {
          if (img.classList.contains(cls)) { outer.classList.add(cls); img.classList.remove(cls); }
        });

        const inner = document.createElement('div');
        inner.style.cssText = `height:${frameH}px; overflow:hidden; position:sticky; top:${navH}px; background:var(--bg);`;

        img.parentNode.insertBefore(outer, img);
        outer.appendChild(inner);
        inner.appendChild(img);

        img.style.position       = 'absolute';
        img.style.objectFit      = 'fill';
        img.style.objectPosition = '';
        img.style.transform      = '';

        function apply(progress) {
          const p  = Math.min(1, Math.max(0, progress));
          const iw = img.naturalWidth;
          const ih = img.naturalHeight;
          const cw = inner.offsetWidth;
          const ch = frameH;

          const coverScale   = Math.max(cw / iw, ch / ih);
          const containScale = Math.min(cw / iw, ch / ih);
          const scale        = coverScale + (containScale - coverScale) * p;

          const w = Math.round(iw * scale);
          const h = Math.round(ih * scale);

          img.style.width  = w + 'px';
          img.style.height = h + 'px';
          img.style.left   = Math.round((cw - w) / 2) + 'px';
          img.style.top    = Math.max(0, Math.round((ch - h) / 2)) + 'px';
          img.style.transform = '';
        }

        apply(0);

        lenis.on('scroll', () => { apply(-outer.getBoundingClientRect().top / vh); });
      }

    (function () {
      document.querySelectorAll('.p-images img').forEach(img => {
        img.addEventListener('load', () => setupTallImg(img));
        if (img.complete && img.naturalWidth) setupTallImg(img);
      });
    })();

    // ── Edit mode ─────────────────────────────────────────────────────────
    if (new URLSearchParams(window.location.search).get('edit') === EDIT_KEY) {
      sessionStorage.setItem('edit-mode', '1');
    }
    if (sessionStorage.getItem('edit-mode') === '1') {
      activateEditMode(accent);
    }
  }

  // ── Edit mode key & function (defined at outer scope, referenced in reinitPage) ───
  const EDIT_KEY = 'faux2025';

  function activateEditMode(accent) {
    document.body.classList.add('edit-mode');

    const style = document.createElement('style');
    style.id = 'edit-styles';
    style.textContent = `
      body.edit-mode [data-edit-target="text"] {
        outline: 1px dashed rgba(200,194,245,0.3);
        min-width: 10px; min-height: 1em;
      }
      body.edit-mode [data-edit-target="text"]:focus {
        outline: 1px solid rgba(200,194,245,0.7);
        background: rgba(200,194,245,0.04);
      }
      body.edit-mode [data-edit-target="image"] {
        cursor: crosshair !important;
        outline: 2px dashed rgba(200,194,245,0.4);
        transition: outline-color 0.2s;
      }
      body.edit-mode [data-edit-target="image"]:hover {
        outline-color: rgba(200,194,245,0.9);
      }

      .edit-layout-bar {
        display: flex; align-items: center; gap: 6px;
        padding: 8px 0 6px;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }
      .edit-layout-bar span {
        font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
        color: #444; margin-right: 4px;
      }
      .edit-layout-bar button {
        font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
        border: 1px solid rgba(240,237,232,0.12); background: transparent;
        color: #666; padding: 3px 9px; cursor: pointer; font-family: inherit;
        transition: border-color 0.15s, color 0.15s;
      }
      .edit-layout-bar button:hover { color: #f0ede8; border-color: rgba(240,237,232,0.3); }
      .edit-layout-bar button.active { border-color: ${accent}; color: ${accent}; }

      #edit-img-panel {
        position: fixed; z-index: 999998;
        background: #0c0c0c; border: 1px solid rgba(200,194,245,0.25);
        padding: 14px 16px; min-width: 320px;
        display: flex; flex-direction: column; gap: 11px;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        max-height: 85vh; overflow-y: auto;
      }
      .eip-row { display: flex; align-items: center; gap: 10px; }
      .eip-label {
        font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
        color: #444; width: 42px; flex-shrink: 0;
      }
      #eip-url {
        flex: 1; background: transparent; border: 1px solid rgba(240,237,232,0.12);
        color: #f0ede8; padding: 5px 8px; font-size: 10px; font-family: monospace;
        outline: none;
      }
      #eip-url:focus { border-color: rgba(200,194,245,0.5); }
      .eip-btns { display: flex; gap: 4px; flex-wrap: wrap; }
      .eip-btns button, #eip-apply {
        font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
        border: 1px solid rgba(240,237,232,0.12); background: transparent;
        color: #888; padding: 4px 9px; cursor: pointer; font-family: inherit;
        transition: border-color 0.15s, color 0.15s;
      }
      .eip-btns button:hover, #eip-apply:hover { color: #f0ede8; border-color: rgba(240,237,232,0.3); }
      .eip-btns button.active { border-color: ${accent}; color: ${accent}; }
      #eip-apply { border-color: rgba(200,194,245,0.4); color: ${accent}; }

      .eip-swatches { display: flex; gap: 4px; align-items: center; }
      .eip-swatches button {
        width: 20px; height: 20px; padding: 0;
        border: 1px solid rgba(240,237,232,0.15);
        cursor: pointer; flex-shrink: 0;
        transition: outline 0.1s;
      }
      .eip-swatches button.active { outline: 2px solid ${accent}; outline-offset: 2px; }
      #eip-bg-custom {
        width: 22px; height: 20px; padding: 1px; cursor: pointer;
        border: 1px solid rgba(240,237,232,0.15); background: transparent;
        flex-shrink: 0;
      }

      .eip-zoom { display: flex; align-items: center; gap: 8px; flex: 1; }
      #eip-zoom {
        flex: 1; -webkit-appearance: none; appearance: none;
        height: 2px; background: rgba(240,237,232,0.12);
        outline: none; cursor: pointer;
      }
      #eip-zoom::-webkit-slider-thumb {
        -webkit-appearance: none; width: 12px; height: 12px;
        border-radius: 50%; background: ${accent}; cursor: pointer;
      }
      #eip-zoom-val {
        font-size: 9px; color: #666; width: 28px;
        text-align: right; font-family: monospace;
      }

      .eip-focal {
        display: grid; grid-template-columns: repeat(3, 24px);
        grid-template-rows: repeat(3, 24px); gap: 3px;
      }
      .eip-focal button {
        width: 24px; height: 24px; padding: 0;
        border: 1px solid rgba(240,237,232,0.12); background: transparent;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: border-color 0.15s, background 0.15s;
        letter-spacing: 0;
      }
      .eip-focal button::after {
        content: ''; width: 4px; height: 4px; border-radius: 50%;
        background: #444; transition: background 0.15s;
      }
      .eip-focal button:hover { border-color: rgba(240,237,232,0.3); }
      .eip-focal button:hover::after { background: #f0ede8; }
      .eip-focal button.active { border-color: ${accent}; }
      .eip-focal button.active::after { background: ${accent}; }

      #edit-bar {
        position: fixed; bottom: 28px; right: 28px; z-index: 999999;
        display: flex; align-items: center; gap: 10px;
        background: #0c0c0c; border: 1px solid rgba(200,194,245,0.3);
        padding: 10px 16px;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }
      .edit-label {
        font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
        color: ${accent};
      }
      #edit-bar button {
        font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase;
        border: 1px solid rgba(240,237,232,0.2); background: transparent;
        color: #f0ede8; padding: 4px 10px; cursor: pointer;
        font-family: inherit; transition: background 0.15s;
      }
      #edit-bar button:hover { background: rgba(240,237,232,0.06); }
      #edit-copy { border-color: ${accent}; color: ${accent}; }
    `;
    document.head.appendChild(style);

    const TEXT = [
      '.p-title', '.p-subtitle', '.p-body',
      '.p-meta-label', '.p-meta-value', '.p-section-label',
      '.p-article-title', '.p-article-meta',
      '.p-project-name', '.p-project-meta',
      '.p-caption-title', '.p-caption-meta',
      '.p-next-title', '.p-next-label',
      '.p-back-title', '.p-back-label',
    ];
    TEXT.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.contentEditable = 'true';
        el.dataset.editTarget = 'text';
      });
    });

    // Block link navigation when clicking inside an editable field, but allow nav links
    document.addEventListener('click', e => {
      if (!e.target.closest('[contenteditable]')) return;
      const a = e.target.closest('a');
      if (!a) return;
      if (a.classList.contains('p-nav-back') || a.classList.contains('p-nav-name')) return;
      e.preventDefault(); e.stopPropagation();
    }, true);

    // Right-click to delete images, meta rows, and text sections
    document.addEventListener('contextmenu', e => {
      const img = e.target.closest('.p-images img');
      if (img) { e.preventDefault(); if (confirm('Remove image?')) img.remove(); return; }
      const metaRow = e.target.closest('.p-meta > div');
      if (metaRow) { e.preventDefault(); if (confirm('Remove this row?')) metaRow.remove(); return; }
    });

    // Option+click on any contenteditable text node → duplicate it inline
    document.addEventListener('mousedown', e => {
      if (!e.altKey) return;
      const el = e.target.closest('[contenteditable="true"]');
      if (!el) return;
      e.preventDefault();
      const clone = el.cloneNode(true);
      clone.contentEditable = 'true';
      clone.dataset.editTarget = 'text';
      el.after(clone);
      // Place cursor at start of clone
      const range = document.createRange();
      range.selectNodeContents(clone);
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      clone.focus();
    }, true);

    const LAYOUTS = [
      { label: 'Stack', cls: '' },
      { label: '2×',    cls: 'grid-2' },
      { label: '3×',    cls: 'grid-3' },
    ];
    document.querySelectorAll('.p-images').forEach(container => {
      const bar = document.createElement('div');
      bar.className = 'edit-layout-bar';
      bar.innerHTML = '<span>Layout</span>' +
        LAYOUTS.map(l => `<button data-layout="${l.cls}">${l.label}</button>`).join('');
      container.before(bar);

      function syncActive() {
        bar.querySelectorAll('button').forEach(btn => {
          const isActive = btn.dataset.layout === ''
            ? !container.classList.contains('grid-2') && !container.classList.contains('grid-3')
            : container.classList.contains(btn.dataset.layout);
          btn.classList.toggle('active', isActive);
        });
      }
      syncActive();

      bar.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        container.classList.remove('grid-2', 'grid-3');
        if (btn.dataset.layout) container.classList.add(btn.dataset.layout);
        syncActive();
      });
    });

    // ── Shared image upload helper ─────────────────────────────────────────
    function bufToBase64(buf) {
      const bytes = new Uint8Array(buf);
      let s = '';
      // Plain loop — safe for any file size (no call-stack limit)
      for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
      return btoa(s);
    }

    async function uploadImageFile(file) {
      const token = localStorage.getItem('gh-edit-token') || '';
      if (!token) throw new Error('no-token');
      const buf = await file.arrayBuffer();
      const b64 = bufToBase64(buf);
      const filename = 'assets/' + file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const res = await fetch(`https://api.github.com/repos/sebastianlewistaylor/portfolio/contents/${filename}`, {
        method: 'PUT',
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Upload ' + file.name, content: b64 })
      });
      if (!res.ok && res.status !== 422) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || res.status);
      }
      return `https://raw.githubusercontent.com/sebastianlewistaylor/portfolio/main/${filename}`;
    }

    let imgPanel = null;

    const heroEl  = document.querySelector('.p-hero');
    const heroImg = document.querySelector('.p-hero img');

    const RATIOS = [
      { label: 'Natural', cls: '' },
      { label: '16:9',    cls: 'ratio-16-9' },
      { label: '4:3',     cls: 'ratio-4-3' },
      { label: '1:1',     cls: 'ratio-1-1' },
      { label: '3:4',     cls: 'ratio-3-4' },
    ];
    const SPANS = [
      { label: 'Normal', cls: '' },
      { label: 'Wide',   cls: 'wide' },
      { label: 'Span 2', cls: 'span-2' },
    ];

    function openImgPanel(img) {
      if (imgPanel) imgPanel.remove();

      const rect        = img.getBoundingClientRect();
      imgPanel          = document.createElement('div');
      imgPanel.id       = 'edit-img-panel';

      const activeRatio = RATIOS.find(r => r.cls && img.classList.contains(r.cls))?.cls || '';
      const activeSpan  = SPANS.find(s => s.cls && img.classList.contains(s.cls))?.cls || '';
      const isHero      = !!img.closest('.p-hero');

      const FOCAL_POS = [
        'left top',    'center top',    'right top',
        'left center', 'center center', 'right center',
        'left bottom', 'center bottom', 'right bottom',
      ];
      const currentPos  = isHero ? (heroImg.dataset.focal || 'center center') : (img.style.objectPosition || 'center center');
      const currentZoom = parseFloat(img.dataset.zoom || '1');
      const currentFit  = img.style.objectFit || 'cover';
      const bgTarget    = isHero ? heroEl : img;
      const currentBg   = bgTarget ? (bgTarget.style.backgroundColor || '#0c0c0c') : '#0c0c0c';
      const isContain   = currentFit === 'contain';

      const BG_SWATCHES = [
        { color: '#0c0c0c', label: 'Black' },
        { color: '#1c1c1c', label: 'Dark' },
        { color: '#2e2e2e', label: 'Mid' },
        { color: '#f0ede8', label: 'Cream' },
        { color: '#ffffff', label: 'White' },
        { color: accent,    label: 'Accent' },
      ];

      imgPanel.innerHTML = `
        <div class="eip-row">
          <span class="eip-label">URL</span>
          <input id="eip-url" type="text" value="${img.src}" spellcheck="false">
          <button id="eip-apply">Apply</button>
        </div>
        <div class="eip-row">
          <span class="eip-label">Zoom</span>
          <div class="eip-zoom">
            <input id="eip-zoom" type="range" min="1" max="2.5" step="0.05" value="${currentZoom}">
            <span id="eip-zoom-val">${currentZoom.toFixed(2)}×</span>
          </div>
        </div>
        <div class="eip-row">
          <span class="eip-label">Fit</span>
          <div class="eip-btns">
            <button data-fit="cover"   class="${!isContain ? 'active' : ''}">Cover</button>
            <button data-fit="contain" class="${isContain  ? 'active' : ''}">Contain</button>
          </div>
        </div>
        <div class="eip-row" id="eip-bg-row" style="${isContain ? '' : 'display:none'}">
          <span class="eip-label">BG</span>
          <div class="eip-swatches">
            ${BG_SWATCHES.map(s =>
              `<button data-bg="${s.color}" title="${s.label}"
                style="background:${s.color}"
                class="${currentBg === s.color ? 'active' : ''}"></button>`
            ).join('')}
            <input id="eip-bg-custom" type="color" value="${currentBg}" title="Custom">
          </div>
        </div>
        <div class="eip-row">
          <span class="eip-label">Focus</span>
          <div class="eip-focal">
            ${FOCAL_POS.map(pos =>
              `<button data-pos="${pos}" class="${currentPos === pos ? 'active' : ''}" title="${pos}"></button>`
            ).join('')}
          </div>
        </div>
        ${!isHero ? `
        <div class="eip-row">
          <span class="eip-label">Ratio</span>
          <div class="eip-btns">
            ${RATIOS.map(r => `<button data-ratio="${r.cls}" class="${activeRatio === r.cls ? 'active' : ''}">${r.label}</button>`).join('')}
          </div>
        </div>
        <div class="eip-row">
          <span class="eip-label">Span</span>
          <div class="eip-btns">
            ${SPANS.map(s => `<button data-span="${s.cls}" class="${activeSpan === s.cls ? 'active' : ''}">${s.label}</button>`).join('')}
          </div>
        </div>` : ''}
      `;

      const top  = Math.min(rect.bottom + 10, window.innerHeight - 160);
      const left = Math.max(10, Math.min(rect.left, window.innerWidth - 340));
      Object.assign(imgPanel.style, { top: top + 'px', left: left + 'px' });
      document.body.appendChild(imgPanel);

      document.getElementById('eip-apply').addEventListener('click', () => {
        const url = document.getElementById('eip-url').value.trim();
        if (url) img.src = url;
      });
      const eipUrl = document.getElementById('eip-url');
      eipUrl.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('eip-apply').click(); });
      eipUrl.addEventListener('focus', () => eipUrl.select());

      const zoomSlider = document.getElementById('eip-zoom');
      const zoomVal    = document.getElementById('eip-zoom-val');
      zoomSlider.addEventListener('input', () => {
        const v = parseFloat(zoomSlider.value);
        if (v === 1) delete img.dataset.zoom;
        else img.dataset.zoom = v;
        zoomVal.textContent = v.toFixed(2) + '×';
        if (isHero && heroEl._applyEffect) heroEl._applyEffect(heroEl._getProgress());
        else img.style.transform = `scale(${v})`;
      });

      imgPanel.querySelectorAll('[data-fit]').forEach(btn => {
        btn.addEventListener('click', () => {
          const fit = btn.dataset.fit;
          if (!isHero) {
            img.style.objectFit = fit === 'cover' ? '' : 'contain';
            if (fit === 'cover') img.style.backgroundColor = '';
          }
          imgPanel.querySelectorAll('[data-fit]').forEach(b => b.classList.toggle('active', b === btn));
          document.getElementById('eip-bg-row').style.display = fit === 'contain' ? '' : 'none';
        });
      });

      function applyBg(color) {
        if (bgTarget) bgTarget.style.backgroundColor = color;
        document.getElementById('eip-bg-custom').value = color;
        imgPanel.querySelectorAll('[data-bg]').forEach(b =>
          b.classList.toggle('active', b.dataset.bg === color));
      }

      imgPanel.querySelectorAll('[data-bg]').forEach(btn => {
        btn.addEventListener('click', () => applyBg(btn.dataset.bg));
      });

      document.getElementById('eip-bg-custom').addEventListener('input', e => {
        if (bgTarget) bgTarget.style.backgroundColor = e.target.value;
        imgPanel.querySelectorAll('[data-bg]').forEach(b => b.classList.remove('active'));
      });

      imgPanel.querySelectorAll('[data-pos]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (isHero) {
            heroImg.dataset.focal = btn.dataset.pos;
            if (heroEl._applyEffect) heroEl._applyEffect(heroEl._getProgress());
          } else {
            img.style.objectPosition = btn.dataset.pos;
          }
          imgPanel.querySelectorAll('[data-pos]').forEach(b =>
            b.classList.toggle('active', b === btn));
        });
      });

      imgPanel.querySelectorAll('[data-ratio]').forEach(btn => {
        btn.addEventListener('click', () => {
          img.classList.remove(...RATIOS.map(r => r.cls).filter(Boolean));
          if (btn.dataset.ratio) img.classList.add(btn.dataset.ratio);
          imgPanel.querySelectorAll('[data-ratio]').forEach(b =>
            b.classList.toggle('active', b === btn));
        });
      });

      imgPanel.querySelectorAll('[data-span]').forEach(btn => {
        btn.addEventListener('click', () => {
          img.classList.remove(...SPANS.map(s => s.cls).filter(Boolean));
          if (btn.dataset.span) img.classList.add(btn.dataset.span);
          imgPanel.querySelectorAll('[data-span]').forEach(b =>
            b.classList.toggle('active', b === btn));
        });
      });
    }

    document.querySelectorAll('.p-hero img, .p-images img').forEach(img => {
      img.dataset.editTarget = 'image';
      img.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openImgPanel(img);
      }, true);
    });

    document.addEventListener('click', e => {
      if (imgPanel && !imgPanel.contains(e.target) && e.target.dataset.editTarget !== 'image') {
        imgPanel.remove();
        imgPanel = null;
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && imgPanel) { imgPanel.remove(); imgPanel = null; }
    });

    // ── Hero drag+drop ────────────────────────────────────────────────────
    if (heroEl && heroImg) {
      let heroDragCount = 0;
      heroEl.addEventListener('dragenter', e => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        if (++heroDragCount === 1) heroEl.style.outline = `2px dashed ${accent}`;
      });
      heroEl.addEventListener('dragleave', () => {
        if (--heroDragCount === 0) heroEl.style.outline = '';
      });
      heroEl.addEventListener('dragover', e => {
        if (e.dataTransfer.types.includes('Files')) e.preventDefault();
      });
      heroEl.addEventListener('drop', async e => {
        e.preventDefault();
        heroDragCount = 0; heroEl.style.outline = '';
        const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        if (!file) return;
        if (!localStorage.getItem('gh-edit-token')) {
          alert('Paste a GitHub token in the edit bar first, then drag to upload.');
          return;
        }
        const prev = heroImg.src;
        heroImg.style.opacity = '0.4';
        try {
          const rawUrl = await uploadImageFile(file);
          heroImg.src = rawUrl; // hero stays as <img> — just update src (video-as-hero not supported)
          heroImg.style.opacity = '';
        } catch (err) {
          heroImg.src = prev; heroImg.style.opacity = '';
          alert(err.message === 'no-token' ? 'No GitHub token in edit bar.' : 'Upload failed: ' + err.message);
        }
      });
    }

    // ── Add/remove gallery images ──────────────────────────────────────────
    document.querySelectorAll('.p-images').forEach(container => {
      const addBtn = document.createElement('button');
      addBtn.className = 'edit-add-img-btn';
      addBtn.textContent = '+ Add Image';
      addBtn.style.cssText = 'font-size:9px;letter-spacing:0.12em;text-transform:uppercase;border:1px solid rgba(200,194,245,0.35);background:transparent;color:#c8c2f5;padding:4px 12px;cursor:pointer;font-family:inherit;display:block;margin:6px 0;';

      addBtn.addEventListener('click', () => {
        // Toggle panel
        const existing = addBtn.nextElementSibling;
        if (existing && existing.classList.contains('edit-add-img-panel')) { existing.remove(); return; }

        const panel = document.createElement('div');
        panel.className = 'edit-add-img-panel';
        panel.style.cssText = 'background:#0c0c0c;border:1px solid rgba(200,194,245,0.25);padding:12px 14px;display:flex;flex-direction:column;gap:9px;font-family:Helvetica Neue,sans-serif;margin-bottom:6px;';
        panel.innerHTML = `
          <div style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#c8c2f5;">Add Media</div>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <span style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#888;white-space:nowrap;">Upload file</span>
            <input type="file" accept="image/*,video/*" class="eip-file" style="font-size:10px;color:#888;flex:1;cursor:pointer;">
          </label>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#888;white-space:nowrap;">Or URL</span>
            <input type="text" placeholder="https://… (image or video)" class="eip-add-url" style="flex:1;background:transparent;border:1px solid rgba(240,237,232,0.15);color:#f0ede8;padding:4px 8px;font-size:10px;font-family:monospace;outline:none;">
            <button class="eip-add-ok" style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;border:1px solid rgba(200,194,245,0.4);background:transparent;color:#c8c2f5;padding:4px 10px;cursor:pointer;font-family:inherit;">Add</button>
          </div>
          <div class="eip-upload-status" style="font-size:9px;color:#888;display:none;"></div>
        `;

        function isVideoUrl(src) {
          return /\.(mp4|webm|mov|ogg|m4v)(\?|#|$)/i.test(src);
        }
        function makeVideoEl(src) {
          const v = document.createElement('video');
          v.src = src; v.autoplay = true; v.muted = true; v.loop = true;
          v.setAttribute('playsinline', ''); v.controls = true;
          v.style.cssText = 'width:100%;display:block;';
          return v;
        }
        function wireMedia(el) {
          el.dataset.editTarget = 'image';
          if (el.tagName === 'IMG') {
            el.alt = ''; el.loading = 'lazy';
            el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openImgPanel(el); }, true);
            el.addEventListener('load', () => setupTallImg(el));
          }
          el.addEventListener('contextmenu', e => { e.preventDefault(); if (confirm('Remove?')) el.remove(); });
          container.appendChild(el);
          panel.remove();
        }

        // File upload → push to GitHub assets/ → use raw URL
        panel.querySelector('.eip-file').addEventListener('change', async function () {
          const file = this.files[0];
          if (!file) return;
          const status = panel.querySelector('.eip-upload-status');
          if (!localStorage.getItem('gh-edit-token')) {
            status.style.display = ''; status.style.color = '#e05555';
            status.textContent = 'No GitHub token — paste URL manually instead.';
            return;
          }
          status.style.display = ''; status.style.color = '#888'; status.textContent = 'Uploading…';
          try {
            const rawUrl = await uploadImageFile(file);
            const el = file.type.startsWith('video/') ? makeVideoEl(rawUrl) : (() => { const img = document.createElement('img'); img.src = rawUrl; return img; })();
            wireMedia(el);
          } catch (err) {
            status.style.color = '#e05555';
            status.textContent = err.message === 'no-token' ? 'No GitHub token — paste URL manually instead.' : 'Upload failed: ' + err.message;
          }
        });

        const urlInput = panel.querySelector('.eip-add-url');
        function addFromUrl() {
          const src = urlInput.value.trim();
          if (!src) return;
          const el = isVideoUrl(src) ? makeVideoEl(src) : (() => { const img = document.createElement('img'); img.src = src; return img; })();
          wireMedia(el);
        }
        panel.querySelector('.eip-add-ok').addEventListener('click', addFromUrl);
        urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addFromUrl(); });

        addBtn.after(panel);
        urlInput.focus();
      });

      container.after(addBtn);

      // Right-click to remove existing images
      container.querySelectorAll('img').forEach(img => {
        img.title = 'Click: edit  |  Right-click: remove';
        img.addEventListener('contextmenu', e => { e.preventDefault(); if (confirm('Remove this image?')) img.remove(); });
      });

      // ── Drag+drop images directly onto the gallery ─────────────────────
      let dragCount = 0;
      container.addEventListener('dragenter', e => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        if (++dragCount === 1) container.style.outline = `2px dashed ${accent}`;
      });
      container.addEventListener('dragleave', () => {
        if (--dragCount === 0) container.style.outline = '';
      });
      container.addEventListener('dragover', e => {
        if (e.dataTransfer.types.includes('Files')) e.preventDefault();
      });
      container.addEventListener('drop', async e => {
        e.preventDefault();
        dragCount = 0; container.style.outline = '';
        const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        if (!file) return;
        if (!localStorage.getItem('gh-edit-token')) {
          alert('Paste a GitHub token in the edit bar first, then drag to upload.');
          return;
        }
        const placeholder = document.createElement('div');
        placeholder.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#888;height:120px;border:1px dashed rgba(200,194,245,0.3);';
        placeholder.textContent = 'Uploading…';
        container.appendChild(placeholder);
        try {
          const rawUrl = await uploadImageFile(file);
          placeholder.remove();
          let el;
          if (file.type.startsWith('video/')) {
            el = document.createElement('video');
            el.src = rawUrl; el.autoplay = true; el.muted = true; el.loop = true;
            el.setAttribute('playsinline', ''); el.controls = true;
            el.style.cssText = 'width:100%;display:block;';
          } else {
            el = document.createElement('img');
            el.src = rawUrl; el.alt = ''; el.loading = 'lazy';
            el.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); openImgPanel(el); }, true);
            el.addEventListener('load', () => setupTallImg(el));
          }
          el.dataset.editTarget = 'image';
          el.addEventListener('contextmenu', ev => { ev.preventDefault(); if (confirm('Remove?')) el.remove(); });
          container.appendChild(el);
        } catch (err) {
          placeholder.style.color = '#e05555';
          placeholder.textContent = err.message === 'no-token' ? 'No GitHub token in edit bar.' : 'Upload failed: ' + err.message;
          setTimeout(() => placeholder.remove(), 4000);
        }
      });
    });

    // ── Add meta row ─────────────────────────────────────────────────────────
    const metaSection = document.querySelector('.p-meta');
    if (metaSection) {
      const addMetaBtn = document.createElement('button');
      addMetaBtn.className = 'edit-meta-add-btn';
      addMetaBtn.textContent = '+ Row';
      addMetaBtn.style.cssText = 'font-size:9px;letter-spacing:0.12em;text-transform:uppercase;border:1px solid rgba(240,237,232,0.12);background:transparent;color:#888;padding:3px 9px;cursor:pointer;font-family:inherit;margin-top:6px;display:block;';
      addMetaBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.innerHTML = `<div class="p-meta-label" contenteditable="true" data-edit-target="text">Label</div><div class="p-meta-value" contenteditable="true" data-edit-target="text">Value</div>`;
        row.style.position = 'relative';
        // Delete row on right-click
        row.title = 'Right-click to remove row';
        row.addEventListener('contextmenu', e => { e.preventDefault(); if (confirm('Remove this meta row?')) row.remove(); });
        metaSection.appendChild(row);
      });
      metaSection.appendChild(addMetaBtn);
    }

    // ── Accent color picker ───────────────────────────────────────────────────
    const accentInput = document.createElement('input');
    accentInput.type = 'color'; accentInput.value = accent || '#c8c2f5';
    accentInput.title = 'Page accent color';
    accentInput.style.cssText = 'width:28px;height:24px;padding:1px;border:1px solid rgba(240,237,232,0.15);background:transparent;cursor:pointer;';
    accentInput.addEventListener('input', () => {
      const c = accentInput.value;
      document.body.dataset.accent = c;
      document.documentElement.style.setProperty('--accent', c);
      // Update the inline style in head
      let styleEl = document.querySelector('head style');
      if (styleEl && styleEl.textContent.includes('--accent')) {
        styleEl.textContent = `:root { --accent: ${c}; }`;
      }
    });

    const bar = document.createElement('div');
    bar.id = 'edit-bar';
    bar.innerHTML = `
      <span class="edit-label">Edit Mode</span>
      <span style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#444;">Accent</span>
      <span style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#444;margin-left:8px;">Music</span>
      <input id="edit-music-url" placeholder="Spotify or YouTube URL"
        style="background:transparent;border:1px solid rgba(240,237,232,0.12);color:#f0ede8;padding:3px 8px;font-size:10px;font-family:monospace;outline:none;width:180px;"
        value="${localStorage.getItem('music-uri') || ''}">
      <button id="edit-music-save" style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;border:1px solid rgba(240,237,232,0.12);background:transparent;color:#888;padding:3px 9px;cursor:pointer;font-family:inherit;">Set</button>
      <span style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#444;margin-left:4px;">🔑</span>
      <input id="edit-gh-token" type="password" placeholder="GitHub token (repo scope)"
        style="background:transparent;border:1px solid rgba(240,237,232,0.12);color:#f0ede8;padding:3px 8px;font-size:10px;font-family:monospace;outline:none;width:160px;"
        value="${localStorage.getItem('gh-edit-token') || ''}">
      <button id="edit-save" style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;border:1px solid #1db954;background:#1db954;color:#000;padding:4px 14px;cursor:pointer;font-family:inherit;font-weight:700;">Save</button>
      <button id="edit-copy">Copy</button>
      <button id="edit-close">Exit</button>
    `;
    // Insert accent picker after "Accent" label
    const accentLabel = bar.querySelector('span:nth-child(2)');
    accentLabel.after(accentInput);
    document.body.appendChild(bar);

    document.getElementById('edit-music-save').addEventListener('click', () => {
      const raw = document.getElementById('edit-music-url').value.trim();
      if (!raw) return;
      // Pass through as-is — music.js detectType() handles Spotify URIs/URLs and YouTube URLs/IDs
      if (window._musicPlayer) window._musicPlayer.updateUri(raw);
      else localStorage.setItem('music-uri', raw);
    });

    function buildCleanHTML() {
      if (imgPanel) { imgPanel.remove(); imgPanel = null; }
      const clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll('[contenteditable]').forEach(el => { el.removeAttribute('contenteditable'); el.removeAttribute('data-edit-target'); });
      clone.querySelectorAll('[data-edit-target]').forEach(el => el.removeAttribute('data-edit-target'));
      clone.querySelectorAll('.edit-layout-bar, .edit-add-img-panel, .edit-add-img-btn, .edit-meta-add-btn').forEach(el => el.remove());
      // Strip runtime-injected music player elements (created by music.js, not in static HTML)
      ['music-btn','music-ring','music-toast','yt-music-wrap'].forEach(id => { const el = clone.querySelector('#' + id); if (el) el.remove(); });
      clone.querySelectorAll('.p-hero-wrapper').forEach(wrapper => {
        const hero = wrapper.querySelector('.p-hero');
        if (hero) { hero.style.position = ''; hero.style.top = ''; hero.style.height = ''; wrapper.replaceWith(hero); }
      });
      clone.querySelectorAll('.p-hero-badge').forEach(el => el.remove());
      const cloneHeroImg = clone.querySelector('.p-hero img');
      if (cloneHeroImg) { ['width','height','left','top','transform','objectFit','objectPosition'].forEach(p => cloneHeroImg.style[p] = ''); }
      clone.querySelectorAll('.tall-img-outer').forEach(outer => {
        const img = outer.querySelector('img');
        if (img) {
          ['wide','span-2'].forEach(cls => { if (outer.classList.contains(cls)) img.classList.add(cls); });
          ['width','height','left','top','position','objectFit','objectPosition','transform'].forEach(p => img.style[p] = '');
          delete img.dataset.tallSetup;
          outer.replaceWith(img);
        }
      });
      ['edit-bar','edit-styles','edit-img-panel'].forEach(id => { const el = clone.querySelector('#' + id); if (el) el.remove(); });
      clone.querySelector('body').classList.remove('edit-mode');
      return '<!DOCTYPE html>\n' + clone.outerHTML;
    }

    // ── Apply user edits to a clean parsed document ───────────────────────────
    function applyEdits(origDoc) {
      // Structural containers — replace wholesale so duplicated/deleted nodes are captured
      ['.p-meta', '.p-info > div'].forEach(sel => {
        document.querySelectorAll(sel).forEach((live, i) => {
          const orig = origDoc.querySelectorAll(sel)[i];
          if (!orig) return;
          const c = live.cloneNode(true);
          c.querySelectorAll('[contenteditable]').forEach(el => { el.removeAttribute('contenteditable'); el.removeAttribute('data-edit-target'); });
          c.querySelectorAll('.edit-meta-add-btn').forEach(el => el.remove());
          orig.innerHTML = c.innerHTML;
        });
      });

      // Text fields — match by selector + position index (for fields outside containers above)
      [
        '.p-title', '.p-subtitle', '.p-body',
        '.p-section-label', '.p-article-title', '.p-article-meta',
        '.p-next-title', '.p-next-label',
        '.p-back-title', '.p-back-label',
      ].forEach(sel => {
        const live = document.querySelectorAll(sel);
        const orig = origDoc.querySelectorAll(sel);
        live.forEach((el, i) => { if (orig[i]) orig[i].innerHTML = el.innerHTML; });
      });

      // Hero image — src, focal point, zoom, fit, background
      const liveHeroImg = document.querySelector('.p-hero img');
      const origHeroImg = origDoc.querySelector('.p-hero img');
      if (liveHeroImg && origHeroImg) {
        origHeroImg.src = liveHeroImg.src;
        ['focal','zoom'].forEach(k => { if (liveHeroImg.dataset[k]) origHeroImg.dataset[k] = liveHeroImg.dataset[k]; });
        ['objectFit','objectPosition'].forEach(p => { if (liveHeroImg.style[p]) origHeroImg.style[p] = liveHeroImg.style[p]; else origHeroImg.style[p] = ''; });
        const liveHero = document.querySelector('.p-hero'), origHero = origDoc.querySelector('.p-hero');
        if (liveHero && origHero && liveHero.style.backgroundColor) origHero.style.backgroundColor = liveHero.style.backgroundColor;
      }

      // Gallery images — replace each .p-images container
      document.querySelectorAll('.p-images').forEach((liveContainer, ci) => {
        const origContainer = origDoc.querySelectorAll('.p-images')[ci];
        if (!origContainer) return;
        // Copy layout classes
        ['grid-2','grid-3'].forEach(cls => {
          origContainer.classList.toggle(cls, liveContainer.classList.contains(cls));
        });
        // Clone images, strip edit UI
        const c = liveContainer.cloneNode(true);
        c.querySelectorAll('.edit-layout-bar, .edit-add-img-btn-outer, button.edit-img-btn, .edit-add-img-panel, .edit-add-img-btn, .edit-meta-add-btn').forEach(el => el.remove());
        // Strip edit artifacts from images; drop base64/Drive srcs
        c.querySelectorAll('img').forEach(img => {
          img.removeAttribute('title');
          img.removeAttribute('data-edit-target');
          if (img.src.startsWith('data:') || img.src.includes('drive.google.com')) img.remove();
        });
        // Strip edit attributes from video elements
        c.querySelectorAll('video').forEach(v => { v.removeAttribute('data-edit-target'); });
        // Unwrap .tall-img-outer back to plain img
        c.querySelectorAll('.tall-img-outer').forEach(outer => {
          const img = outer.querySelector('img');
          if (img) {
            ['wide','span-2'].forEach(cls => { if (outer.classList.contains(cls)) img.classList.add(cls); });
            ['width','height','left','top','position','transform'].forEach(p => img.style[p] = '');
            delete img.dataset.tallSetup;
            outer.replaceWith(img);
          }
        });
        origContainer.innerHTML = c.innerHTML;
      });

      // Accent color
      const accent = document.body.dataset.accent || document.documentElement.style.getPropertyValue('--accent').trim();
      if (accent) {
        origDoc.body.dataset.accent = accent;
        const styleEl = Array.from(origDoc.head.querySelectorAll('style')).find(s => s.textContent.includes('--accent'));
        if (styleEl) styleEl.textContent = styleEl.textContent.replace(/--accent\s*:[^;]+;/, `--accent: ${accent};`);
      }
    }

    // ── GitHub API push (publishes directly to the repo) ──────────────────
    async function ghPush(filename) {
      const REPO = 'sebastianlewistaylor/portfolio';
      const saveEl = document.getElementById('edit-save');
      const tokenInput = document.getElementById('edit-gh-token');

      const token = (tokenInput ? tokenInput.value.trim() : '') || localStorage.getItem('gh-edit-token') || '';
      if (!token) {
        saveEl.textContent = 'Paste token in 🔑 first';
        saveEl.style.cssText += ';background:#333!important;color:#fff!important;';
        saveEl.disabled = false;
        setTimeout(() => { saveEl.textContent = 'Save'; saveEl.style.cssText = saveEl.style.cssText.replace(/;?background:[^;]+!important/g,'').replace(/;?color:[^;]+!important/g,''); }, 3500);
        if (tokenInput) { tokenInput.focus(); tokenInput.style.outline = '2px solid #e05555'; setTimeout(() => { if (tokenInput) tokenInput.style.outline = ''; }, 3500); }
        return;
      }
      localStorage.setItem('gh-edit-token', token);

      saveEl.textContent = 'Pushing…';

      try {
        const apiUrl = `https://api.github.com/repos/${REPO}/contents/${filename}`;
        const headers = { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };

        const getRes = await fetch(apiUrl, { headers });
        if (getRes.status === 401 || getRes.status === 403) {
          localStorage.removeItem('gh-edit-token');
          if (tokenInput) { tokenInput.value = ''; tokenInput.style.outline = '2px solid #e05555'; setTimeout(() => { tokenInput.style.outline = ''; }, 4000); tokenInput.focus(); }
          saveEl.textContent = 'Token invalid — re-enter 🔑';
          saveEl.style.cssText += ';background:#c0392b!important;color:#fff!important;';
          saveEl.disabled = false;
          setTimeout(() => { saveEl.textContent = 'Save'; saveEl.style.cssText = saveEl.style.cssText.replace(/;?background:[^;]+!important/g,'').replace(/;?color:[^;]+!important/g,''); }, 4000);
          return;
        }
        if (!getRes.ok) throw new Error('GitHub HTTP ' + getRes.status);
        const fileData = await getRes.json();

        // Decode original HTML from GitHub, parse to clean document, apply only user edits
        const bytes = Uint8Array.from(atob(fileData.content.replace(/[\r\n]/g, '')), c => c.charCodeAt(0));
        const origHTML = new TextDecoder().decode(bytes);
        const origDoc = new DOMParser().parseFromString(origHTML, 'text/html');
        applyEdits(origDoc);
        const html = '<!DOCTYPE html>\n' + origDoc.documentElement.outerHTML;

        const encoded = btoa(unescape(encodeURIComponent(html)));
        const putRes  = await fetch(apiUrl, {
          method: 'PUT', headers,
          body: JSON.stringify({ message: 'Update ' + filename + ' via edit mode', content: encoded, sha: fileData.sha })
        });
        if (!putRes.ok) { const e = await putRes.json().catch(() => ({})); throw new Error(e.message || 'Push failed ' + putRes.status); }

        saveEl.textContent = 'Published ✓';
        saveEl.style.background = '#17a849'; saveEl.style.opacity = '';
        saveEl.disabled = false;
        setTimeout(() => { saveEl.textContent = 'Save'; saveEl.style.background = ''; }, 3500);
      } catch (err) {
        saveEl.textContent = 'Save'; saveEl.style.opacity = ''; saveEl.disabled = false;
        alert('Save failed: ' + err.message);
      }
    }

    document.getElementById('edit-save').addEventListener('click', async () => {
      const saveEl = document.getElementById('edit-save');
      saveEl.textContent = '…';
      saveEl.disabled = true;
      try {
        const slug = (window.location.pathname.replace(/^\/portfolio\//, '') || 'index.html').replace(/^\//, '') || 'index.html';
        await ghPush(slug);
      } catch (err) {
        saveEl.textContent = 'Save';
        saveEl.disabled = false;
        alert('Save error: ' + err.message);
      }
    });

    document.getElementById('edit-copy').addEventListener('click', () => {
      const html = buildCleanHTML();
      navigator.clipboard.writeText(html)
        .then(() => { document.getElementById('edit-copy').textContent = 'Copied!'; setTimeout(() => { const b = document.getElementById('edit-copy'); if (b) b.textContent = 'Copy'; }, 2500); })
        .catch(() => { const ta = document.createElement('textarea'); ta.value = html; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); document.getElementById('edit-copy').textContent = 'Copied!'; setTimeout(() => { const b = document.getElementById('edit-copy'); if (b) b.textContent = 'Copy'; }, 2500); });
    });

    document.getElementById('edit-close').addEventListener('click', () => {
      sessionStorage.removeItem('edit-mode');
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      window.location.href = url.toString();
    });
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  reinitPage();
  window._reinitPage = reinitPage;

})();
