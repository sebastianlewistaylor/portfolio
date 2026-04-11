// page.js — shared JS for all project & archive pages
// Reads accent color from body[data-accent]
// Reads next-link color from #next-link[data-color]

(function () {
  const accent = document.body.dataset.accent || '#c8c2f5';

  // --- Cursor ---
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2, fx = mx, fy = my;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.querySelectorAll('a,button').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
  (function tick() {
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
    fx += (mx - fx) * 0.08;
    fy += (my - fy) * 0.08;
    gsap.set(follower, { x: fx - 40, y: fy - 40 });
    requestAnimationFrame(tick);
  })();

  // --- Page transition: corner arrows + gradient circle splash ---

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
    const wrap = document.createElement('div');
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

  // Exit: arrows converge + circle splash covers screen → navigate
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

    const tl = gsap.timeline({ onComplete() { window.location.href = href; } });
    tl.to(fills,   { scale:1, duration:0.18, stagger:0.015, ease:'power3.inOut' })
      .to(circles, { x:(i)=>circles[i]._dx, y:(i)=>circles[i]._dy, scale:1, duration:0.22, stagger:0.02, ease:'power3.out' }, '-=0.04');
  }

  // Entry: splash starts fully covered → arrows fly outward + blur/fade reveal
  (function entryReveal() {
    const stored = sessionStorage.getItem('pt-colors');
    if (!stored) return;
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

  // Back to index
  ['back-link', 'back-link2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { e.preventDefault(); nav('index.html', accent); });
  });

  // Next project
  const nextLink = document.getElementById('next-link');
  if (nextLink) {
    nextLink.addEventListener('click', e => {
      e.preventDefault();
      nav(nextLink.getAttribute('href'), nextLink.dataset.color || accent);
    });
  }

  // --- Lenis smooth scroll ---
  const lenis = new Lenis({ lerp: 0.08 });
  (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);

  // --- Hero scroll: cover → contain (full image visible), sticky ---
  // Hero stays 100vh. Image interpolates from cover scale → contain scale using
  // explicit width/height — so the full image is visible at scroll progress = 1.
  // Wrapper is 200vh: hero un-sticks exactly when animation reaches progress = 1.
  const heroEl  = document.querySelector('.p-hero');
  const heroImg = document.querySelector('.p-hero img');

  if (heroEl && heroImg) {
    let currentProgress = 0;

    // Hero sits below the nav bar — measure nav height with fallback
    const heroNavH = (document.querySelector('.p-nav') || {}).offsetHeight || 73;
    const heroFrameH = window.innerHeight - heroNavH;

    // Sticky wrapper (200vh = one viewport of scroll budget)
    const heroWrapper = document.createElement('div');
    heroWrapper.className = 'p-hero-wrapper';
    heroWrapper.style.cssText = 'position:relative; height:200vh;';
    heroEl.parentNode.insertBefore(heroWrapper, heroEl);
    heroWrapper.appendChild(heroEl);
    heroEl.style.cssText = `position:sticky; top:${heroNavH}px; height:${heroFrameH}px; overflow:hidden;`;

    // Override CSS object-fit:cover — 'fill' lets the element dimensions we set drive rendering
    heroImg.style.objectFit = 'fill';
    heroImg.style.objectPosition = '';

    // Title badge — text pulled from existing page elements
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

      // cover: image fills entire 100vh container (cropped)
      // contain: full image fits within 100vh container (background visible around it)
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
      // when image overflows container, clamp to edges; when smaller, center/focal within
      if (w >= cw) x = Math.min(0, Math.max(cw - w, x));
      else         x = Math.min(cw - w, Math.max(0, x));
      if (h >= ch) y = Math.min(0, Math.max(ch - h, y));
      else         y = Math.min(ch - h, Math.max(0, y));

      heroImg.style.width     = w + 'px';
      heroImg.style.height    = h + 'px';
      heroImg.style.left      = x + 'px';
      heroImg.style.top       = y + 'px';
      heroImg.style.transform = '';

      // Badge fades out over first ~40% of scroll
      heroBadge.style.opacity = Math.max(0, 1 - currentProgress * 2.5);
    }

    if (heroImg.complete && heroImg.naturalWidth) applyEffect(0);
    heroImg.addEventListener('load', () => applyEffect(currentProgress));
    window.addEventListener('resize', () => applyEffect(currentProgress), { passive: true });

    lenis.on('scroll', ({ scroll }) => {
      applyEffect(scroll / window.innerHeight);
    });

    // Expose for edit mode
    heroEl._applyEffect = applyEffect;
    heroEl._getProgress = () => currentProgress;
  }

  // --- Tall image scroll reveal (cover → contain, same mechanic as hero) ---
  // Portrait / tall images get a 200vh wrapper + sticky 100vh frame.
  // Image scales from cover (fills frame, cropped) → contain (full image visible).
  // Exactly mirrors the hero effect — one viewport height of scrolling = full reveal.
  (function () {
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
      if (naturalDisplayH <= vh) return; // fits in viewport — no effect needed

      img.dataset.tallSetup = '1';

      // Sticky frame sits permanently below the nav bar
      const navH = (document.querySelector('.p-nav') || {}).offsetHeight || 73;
      const frameH = vh - navH;

      // 200vh outer = exactly 1×vh of sticky scroll budget (same as hero wrapper)
      const outer = document.createElement('div');
      outer.style.cssText = `height:${2 * vh}px; position:relative;`;
      SPAN_CLASSES.forEach(cls => {
        if (img.classList.contains(cls)) { outer.classList.add(cls); img.classList.remove(cls); }
      });

      // Sticky frame below the nav — overflow:hidden clips the cover-scale image
      const inner = document.createElement('div');
      inner.style.cssText = `height:${frameH}px; overflow:hidden; position:sticky; top:${navH}px; background:var(--bg);`;

      img.parentNode.insertBefore(outer, img);
      outer.appendChild(inner);
      inner.appendChild(img);

      img.style.position   = 'absolute';
      img.style.objectFit  = 'fill';
      img.style.objectPosition = '';
      img.style.transform  = '';

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

      // Progress derived live from DOM position — no pre-captured reference needed.
      // When outer's top is at 0 (entering viewport) → p=0 (cover).
      // When outer's top is at -vh (scrolled one viewport) → p=1 (contain).
      lenis.on('scroll', () => {
        apply(-outer.getBoundingClientRect().top / vh);
      });
    }

    document.querySelectorAll('.p-images img').forEach(img => {
      img.addEventListener('load', () => setupTallImg(img));
      if (img.complete && img.naturalWidth) setupTallImg(img);
    });
  })();

  // --- Edit mode ---
  // Activate: visit any page with ?edit=YOUR_KEY in the URL
  // e.g. internet-journal.html?edit=faux2025
  // Change EDIT_KEY to whatever you want
  const EDIT_KEY = 'faux2025';

  if (new URLSearchParams(window.location.search).get('edit') === EDIT_KEY) {
    activateEditMode(accent);
  }

  function activateEditMode(accent) {
    document.body.classList.add('edit-mode');

    // --- Inject styles ---
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

      /* Layout bar above each .p-images block */
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

      /* Image panel */
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

      /* BG color swatches */
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

      /* Zoom slider */
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

      /* Focal point grid */
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

      /* Main edit bar */
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

    // --- Text editing ---
    const TEXT = [
      '.p-title', '.p-subtitle', '.p-body',
      '.p-meta-value', '.p-section-label',
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

    // --- Layout bars above each .p-images block ---
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

    // --- Image panel ---
    let imgPanel = null;

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

      const rect = img.getBoundingClientRect();
      imgPanel = document.createElement('div');
      imgPanel.id = 'edit-img-panel';

      const activeRatio = RATIOS.find(r => r.cls && img.classList.contains(r.cls))?.cls || '';
      const activeSpan  = SPANS.find(s => s.cls && img.classList.contains(s.cls))?.cls || '';
      const isHero = !!img.closest('.p-hero');

      // Focal point positions (row-major, top→bottom left→right)
      const FOCAL_POS = [
        'left top',    'center top',    'right top',
        'left center', 'center center', 'right center',
        'left bottom', 'center bottom', 'right bottom',
      ];
      const currentPos  = isHero ? (heroImg.dataset.focal || 'center center') : (img.style.objectPosition || 'center center');
      const currentZoom = parseFloat(img.dataset.zoom || '1');
      const currentFit  = img.style.objectFit || 'cover';
      // For hero, BG lives on the container; for gallery images, on the img itself
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

      // Position: below the image, clamped to viewport
      const top = Math.min(rect.bottom + 10, window.innerHeight - 160);
      const left = Math.max(10, Math.min(rect.left, window.innerWidth - 340));
      Object.assign(imgPanel.style, { top: top + 'px', left: left + 'px' });
      document.body.appendChild(imgPanel);

      // URL apply
      document.getElementById('eip-apply').addEventListener('click', () => {
        const url = document.getElementById('eip-url').value.trim();
        if (url) img.src = url;
      });
      document.getElementById('eip-url').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('eip-apply').click();
      });

      // Zoom slider — stores in data-zoom so the scroll effect can read it
      const zoomSlider = document.getElementById('eip-zoom');
      const zoomVal = document.getElementById('eip-zoom-val');
      zoomSlider.addEventListener('input', () => {
        const v = parseFloat(zoomSlider.value);
        if (v === 1) delete img.dataset.zoom;
        else img.dataset.zoom = v;
        zoomVal.textContent = v.toFixed(2) + '×';
        if (isHero && heroEl._applyEffect) heroEl._applyEffect(heroEl._getProgress());
        else img.style.transform = `scale(${v})`;
      });

      // Fit buttons (hero: always cover in terms of object-fit, scroll handles contain effect)
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

      // BG swatches — hero BG goes on the container, gallery BG on the img
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

      // Focal point buttons
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

      // Ratio buttons
      imgPanel.querySelectorAll('[data-ratio]').forEach(btn => {
        btn.addEventListener('click', () => {
          img.classList.remove(...RATIOS.map(r => r.cls).filter(Boolean));
          if (btn.dataset.ratio) img.classList.add(btn.dataset.ratio);
          imgPanel.querySelectorAll('[data-ratio]').forEach(b =>
            b.classList.toggle('active', b === btn));
        });
      });

      // Span buttons
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

    // Close image panel on outside click / Escape
    document.addEventListener('click', e => {
      if (imgPanel && !imgPanel.contains(e.target) && e.target.dataset.editTarget !== 'image') {
        imgPanel.remove();
        imgPanel = null;
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && imgPanel) { imgPanel.remove(); imgPanel = null; }
    });

    // --- Main edit bar ---
    const bar = document.createElement('div');
    bar.id = 'edit-bar';
    bar.innerHTML = `
      <span class="edit-label">Edit Mode</span>
      <div style="display:flex;align-items:center;gap:6px;margin-left:auto;margin-right:8px;">
        <span style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#444;">Music URL</span>
        <input id="edit-music-url" placeholder="YouTube URL or video ID"
          style="background:transparent;border:1px solid rgba(240,237,232,0.12);color:#f0ede8;padding:3px 8px;font-size:10px;font-family:monospace;outline:none;width:260px;"
          value="${localStorage.getItem('music-vid') ? 'https://www.youtube.com/watch?v=' + localStorage.getItem('music-vid') : ''}">
        <button id="edit-music-save" style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;border:1px solid rgba(240,237,232,0.12);background:transparent;color:#888;padding:3px 9px;cursor:pointer;font-family:inherit;">Set</button>
      </div>
      <button id="edit-copy">Copy HTML</button>
      <button id="edit-close">Exit</button>
    `;
    document.body.appendChild(bar);

    // Music URL update
    document.getElementById('edit-music-save').addEventListener('click', () => {
      const raw = document.getElementById('edit-music-url').value.trim();
      const vidMatch  = raw.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
      const listMatch = raw.match(/[?&]list=([^&\s]+)/);
      const vid  = vidMatch  ? vidMatch[1]  : raw.replace(/\s/g,'');
      const list = listMatch ? listMatch[1] : vid;
      if (vid && window._musicPlayer) window._musicPlayer.updateUrl(vid, list);
    });

    // Copy HTML — strips all edit scaffolding
    document.getElementById('edit-copy').addEventListener('click', () => {
      if (imgPanel) { imgPanel.remove(); imgPanel = null; }

      const clone = document.documentElement.cloneNode(true);

      clone.querySelectorAll('[contenteditable]').forEach(el => {
        el.removeAttribute('contenteditable');
        el.removeAttribute('data-edit-target');
      });
      clone.querySelectorAll('[data-edit-target]').forEach(el => {
        el.removeAttribute('data-edit-target');
      });
      clone.querySelectorAll('.edit-layout-bar').forEach(el => el.remove());
      // Strip JS-injected hero wrapper (unwrap back to original structure)
      clone.querySelectorAll('.p-hero-wrapper').forEach(wrapper => {
        const hero = wrapper.querySelector('.p-hero');
        if (hero) { hero.style.position = ''; hero.style.top = ''; hero.style.height = ''; wrapper.replaceWith(hero); }
      });
      // Strip dynamically-generated hero badge (rebuilt from page text on each load)
      clone.querySelectorAll('.p-hero-badge').forEach(el => el.remove());
      // Reset hero image inline styles (JS-driven, will re-apply on load)
      const cloneHeroImg = clone.querySelector('.p-hero img');
      if (cloneHeroImg) { ['width','height','left','top','transform','objectFit','objectPosition'].forEach(p => cloneHeroImg.style[p] = ''); }
      ['edit-bar', 'edit-styles', 'edit-img-panel'].forEach(id => {
        const el = clone.getElementById(id);
        if (el) el.remove();
      });
      clone.querySelector('body').classList.remove('edit-mode');

      const html = '<!DOCTYPE html>\n' + clone.outerHTML;
      const copy = btn => { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy HTML'; }, 2500); };

      navigator.clipboard.writeText(html)
        .then(() => copy(document.getElementById('edit-copy')))
        .catch(() => {
          const ta = document.createElement('textarea');
          ta.value = html; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); ta.remove();
          copy(document.getElementById('edit-copy'));
        });
    });

    // Exit
    document.getElementById('edit-close').addEventListener('click', () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('edit');
      window.location.href = url.toString();
    });
  }
})();
