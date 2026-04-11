// router.js — client-side navigation so music/cursor persist across page changes.
// Must be loaded before page.js and index inline scripts.
(function () {

  // IDs that must never be removed from the body during a swap.
  // These elements are left exactly where they are — no moves, no detachment.
  var PERSIST = ['music-btn', 'music-ring', 'music-toast', 'yt-music-wrap', 'cursor', 'cursorFollower'];
  var persistSet = {};
  PERSIST.forEach(function (id) { persistSet[id] = true; });

  function doSwap(html, href) {
    var doc = (new DOMParser()).parseFromString(html, 'text/html');

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
    var frag = document.createDocumentFragment();
    Array.from(doc.body.childNodes).forEach(function (node) {
      if (!persistSet[node.id]) {
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

    // ── Re-wire cursor hover for new interactive elements ─────────────────
    document.querySelectorAll('a,button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
    });

    // ── Re-initialize page logic ──────────────────────────────────────────
    var base = href.split('?')[0].replace(/.*\//, '');
    var isIndex = base === '' || base === 'index.html';

    if (isIndex) {
      // Signal the index splash to skip (pt-entry animation plays instead)
      sessionStorage.setItem('spa-arriving', '1');

      // Re-execute inline scripts from the fetched index; skip already-loaded externals
      var loadedSrcs = Array.from(document.querySelectorAll('script[src]'))
        .map(function (s) { return s.src; });

      doc.body.querySelectorAll('script').forEach(function (orig) {
        var ns = document.createElement('script');
        if (orig.src) {
          var abs = new URL(orig.src, window.location.href).href;
          if (loadedSrcs.indexOf(abs) !== -1) return; // already loaded
          ns.src = orig.src;
        } else {
          ns.textContent = orig.textContent;
        }
        document.body.insertBefore(ns, anchor);
      });
    } else {
      // Project page — re-init Lenis, hero, tall images, nav links, entry animation
      if (window._reinitPage) window._reinitPage();
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
