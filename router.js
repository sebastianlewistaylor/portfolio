// router.js — client-side navigation so music/cursor persist across page changes.
// Must be loaded before page.js and index inline scripts.
(function () {
  // IDs to preserve across DOM swaps
  var KEEP_IDS = ['music-btn', 'music-ring', 'music-toast', 'yt-music-wrap', 'cursor', 'cursorFollower'];

  function doSwap(html, href) {
    var doc = (new DOMParser()).parseFromString(html, 'text/html');

    // Snapshot persistent elements before wiping
    var saved = KEEP_IDS.map(function (id) { return document.getElementById(id); }).filter(Boolean);

    // Destroy page.js Lenis before wipe so its RAF doesn't error on detached nodes
    if (window._destroyPageLenis) window._destroyPageLenis();

    // Swap body
    document.body.innerHTML = doc.body.innerHTML;

    // Mirror body attributes (data-accent, class, etc.)
    Array.from(doc.body.attributes).forEach(function (attr) {
      document.body.setAttribute(attr.name, attr.value);
    });

    // Apply new accent CSS variable
    var accent = doc.body.dataset.accent;
    if (accent) document.documentElement.style.setProperty('--accent', accent);

    // Re-attach persistent elements
    saved.forEach(function (el) { if (el) document.body.appendChild(el); });

    // Push new URL + title
    document.title = doc.title;
    history.pushState({}, doc.title, href);
    window.scrollTo(0, 0);

    // Re-wire cursor hover for new interactive elements
    document.querySelectorAll('a,button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
    });

    // Determine destination type
    var base = href.split('?')[0].replace(/.*\//, '');
    var isIndex = base === '' || base === 'index.html';

    if (isIndex) {
      // Tell index splash to skip the intro animation (we'll get the pt-entry instead)
      sessionStorage.setItem('spa-arriving', '1');

      // Re-execute new page scripts — skip externals that are already loaded
      var loadedSrcs = Array.from(document.querySelectorAll('script[src]'))
        .map(function (s) { return s.src; });

      doc.body.querySelectorAll('script').forEach(function (orig) {
        var ns = document.createElement('script');
        if (orig.src) {
          var abs = new URL(orig.src, window.location.href).href;
          if (loadedSrcs.indexOf(abs) !== -1) return; // already present
          ns.src = orig.src;
        } else {
          ns.textContent = orig.textContent;
        }
        document.body.appendChild(ns);
      });
    } else {
      // Project page — re-init Lenis, hero, tall images, nav links, entry animation
      if (window._reinitPage) window._reinitPage();
    }
  }

  // Public API: navigate with optional pre-started fetch promise (for concurrency with exit anim)
  window._spaNav = function (href, fetchPromise) {
    var p = fetchPromise || fetch(href).then(function (r) { return r.text(); });
    p.then(function (html) { doSwap(html, href); });
  };

  // Back / forward button
  window.addEventListener('popstate', function () {
    window._spaNav(window.location.href);
  });
})();
