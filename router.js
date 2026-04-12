// router.js — client-side navigation so music/cursor persist across page changes.
// Must be loaded before page.js and index inline scripts.
(function () {
  // Guard: router.js runs exactly once. Prevents duplicate popstate listeners
  // when the index re-execution path re-runs this script.
  if (window._spaNav) return;

  // IDs that must never be removed from the body during a swap.
  // These elements are left exactly where they are — no moves, no detachment.
  var PERSIST = ['music-btn', 'music-ring', 'music-toast', 'yt-music-wrap', 'cursor', 'cursorFollower'];
  var persistSet = {};
  PERSIST.forEach(function (id) { persistSet[id] = true; });

  function doSwap(html, href) {
    var doc = (new DOMParser()).parseFromString(html, 'text/html');

    // Snapshot loaded external scripts BEFORE step 1 removes body script elements
    var loadedSrcs = Array.from(document.querySelectorAll('script[src]'))
      .map(function (s) { return s.src; });

    // ── Head: sync <style> blocks and <link rel="stylesheet"> ────────────
    // Remove old inline styles, import new ones (this fixes index ↔ project style mismatch)
    document.head.querySelectorAll('style').forEach(function (s) { s.remove(); });
    doc.head.querySelectorAll('style').forEach(function (s) {
      document.head.appendChild(document.importNode(s, true));
    });

    // Add stylesheet links from new page that aren't present; remove ones no longer needed
    var oldLinks = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'));
    var newLinks = Array.from(doc.head.querySelectorAll('link[rel="stylesheet"]'));
    var oldHrefs = oldLinks.map(function (l) { return l.getAttribute('href'); });
    var newHrefs = newLinks.map(function (l) { return l.getAttribute('href'); });
    oldLinks.forEach(function (l) {
      if (newHrefs.indexOf(l.getAttribute('href')) === -1) l.remove();
    });
    newLinks.forEach(function (l) {
      if (oldHrefs.indexOf(l.getAttribute('href')) === -1) {
        document.head.appendChild(document.importNode(l, true));
      }
    });

    // ── Stop lingering cursor loops before the swap ───────────────────────
    if (window._destroyIndexCursor) { window._destroyIndexCursor(); window._destroyIndexCursor = null; }
    if (window._disablePageCursor)  window._disablePageCursor();

    // ── Destroy any active Lenis instances ────────────────────────────────
    if (window._destroyIndexLenis) window._destroyIndexLenis();
    if (window._destroyPageLenis)  window._destroyPageLenis();

    // ── Body swap: surgically replace non-persistent children ────────────
    // Persistent elements (music iframe, cursor) stay exactly in place —
    // never moved, never detached — so the YouTube player keeps playing.

    // 1. Remove all current body children except persistent ones
    Array.from(document.body.childNodes).forEach(function (node) {
      if (!persistSet[node.id]) document.body.removeChild(node);
    });

    // 2. Find the earliest persistent element to use as an insert anchor
    var anchor = null;
    for (var i = 0; i < PERSIST.length; i++) {
      var el = document.getElementById(PERSIST[i]);
      if (el) { anchor = el; break; }
    }

    // 3. Import new body content (skip nodes that would collide with persist IDs)
    // Also skip <script> elements — they're already loaded; re-importing them
    // causes music.js / page.js / router.js to re-execute and create duplicate
    // players / event listeners. _reinitPage() handles all per-page re-init.
    var frag = document.createDocumentFragment();
    Array.from(doc.body.childNodes).forEach(function (node) {
      if (!persistSet[node.id] && node.nodeName !== 'SCRIPT') {
        frag.appendChild(document.importNode(node, true));
      }
    });
    document.body.insertBefore(frag, anchor); // null anchor → append (fine)

    // ── Update body attributes ────────────────────────────────────────────
    var attrNames = Array.from(document.body.attributes).map(function (a) { return a.name; });
    attrNames.forEach(function (n) { document.body.removeAttribute(n); });
    Array.from(doc.body.attributes).forEach(function (a) {
      document.body.setAttribute(a.name, a.value);
    });

    // Apply accent CSS variable
    var accent = doc.body.dataset.accent;
    if (accent) document.documentElement.style.setProperty('--accent', accent);

    // ── History + scroll ─────────────────────────────────────────────────
    document.title = doc.title;
    history.pushState({}, doc.title, href);
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('spa-navigated'));

    // ── Re-wire cursor hover for new interactive elements ─────────────────
    document.querySelectorAll('a,button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
    });

    // ── Re-initialize page logic ──────────────────────────────────────────
    var base = href.split('?')[0].replace(/.*\//, '');
    var isIndex = base === '' || base === 'index.html';

    // Music continuity handled by watchdog in music.js — no resume call needed here

    if (isIndex) {
      // Signal the index splash to skip (pt-entry animation plays instead)
      sessionStorage.setItem('spa-arriving', '1');

      // Remove the static #splash immediately — its ::after triangles look like a
      // play button at screen centre and can flash if ScrollTrigger is still loading.
      // The inline script would remove it eventually, but we do it here first.
      var splashEl = document.getElementById('splash');
      if (splashEl) splashEl.remove();

      // Immediately restart index cursor — no external deps needed.
      // _initIndexCursor is defined by index.html on first load and persists on window.
      if (window._initIndexCursor) window._initIndexCursor();

      // Observe reveal elements immediately — fires on next tick for in-viewport elements
      // without waiting for ScrollTrigger to load. Fixes black page on SPA back-nav
      // without touching cursor elements or blocking the RAF loop.
      (function () {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
          });
        }, { threshold: 0.15 });
        document.querySelectorAll('.reveal-inner, .fade-up, .line-expand, .cursive-top').forEach(function (el) {
          obs.observe(el);
        });
      })();

      // Re-execute index scripts — external first, inline after all external have loaded.
      // This ensures ScrollTrigger (not present on project pages) is ready before
      // the inline script calls gsap.registerPlugin(ScrollTrigger) / ScrollTrigger.update.
      var pending = 0;
      var inlineTexts = [];

      function flushInline() {
        inlineTexts.forEach(function (text) {
          var ns = document.createElement('script');
          ns.textContent = text;
          document.body.insertBefore(ns, anchor);
        });
      }

      doc.body.querySelectorAll('script').forEach(function (orig) {
        if (orig.src) {
          var abs = new URL(orig.src, window.location.href).href;
          if (loadedSrcs.indexOf(abs) !== -1) return; // already loaded
          pending++;
          var ns = document.createElement('script');
          ns.src = abs;
          ns.onload = ns.onerror = function () { if (--pending === 0) flushInline(); };
          document.body.insertBefore(ns, anchor);
        } else {
          inlineTexts.push(orig.textContent);
        }
      });

      if (pending === 0) flushInline(); // all deps already loaded — run inline immediately
    } else {
      // Project page — re-init Lenis, hero, tall images, nav links, entry animation
      if (window._reinitPage) {
        window._reinitPage();
      } else {
        // page.js not loaded yet (user arrived at index first) — inject it;
        // page.js calls reinitPage() itself as its bootstrap.
        var ps = document.createElement('script');
        ps.src = 'page.js';
        document.body.appendChild(ps);
      }
    }
  }

  // Public: begin navigation, accepting an optional pre-started fetch promise
  // (nav() in page.js starts fetching before the exit animation completes)
  window._spaNav = function (href, fetchPromise) {
    var p = fetchPromise || fetch(href).then(function (r) { return r.text(); });
    p.then(function (html) { doSwap(html, href); });
  };

  // Back / forward button support
  window.addEventListener('popstate', function () {
    window._spaNav(window.location.href);
  });

})();
