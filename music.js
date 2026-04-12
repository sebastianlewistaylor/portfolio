// music.js — ambient background music player using Spotify Embed iFrame API
// Included on every page. Spotify iFrame API loaded here.

(function () {
  // Guard: runs exactly once. Back-navigation re-executes scripts but this prevents a second player.
  if (window._musicPlayer) return;

  function storedUri() { return localStorage.getItem('music-uri') || ''; }

  // ── Pastel color generator (same as transition splash) ────────────────────
  function randColor() {
    var h = Math.random() * 360;
    var s = 55 + Math.random() * 30;
    var l = 72 + Math.random() * 14;
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
  }
  function makeRingGradient() {
    var colors = [randColor(), randColor(), randColor(), randColor()];
    return 'conic-gradient(' + colors.join(',') + ',' + colors[0] + ')';
  }

  // ── Button ─────────────────────────────────────────────────────────────────
  var btn = document.createElement('button');
  btn.id = 'music-btn';
  btn.setAttribute('aria-label', 'Toggle music');
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L5.5 3.5V10.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="3.5" cy="10.5" r="2" fill="currentColor"/><circle cx="11" cy="8.5" r="2" fill="currentColor"/></svg>';
  document.body.appendChild(btn);

  // ── Gradient ring ──────────────────────────────────────────────────────────
  var ring = document.createElement('div');
  ring.id = 'music-ring';
  document.body.appendChild(ring);

  function positionRing() {
    var r = btn.getBoundingClientRect();
    var rw = 64, rh = 64;
    ring.style.left = Math.round(r.left - (rw - r.width) / 2) + 'px';
    ring.style.top  = Math.round(r.top  - (rh - r.height) / 2) + 'px';
  }
  function showRing() {
    ring.style.background = makeRingGradient();
    positionRing();
    ring.classList.add('visible');
  }
  function hideRing() { ring.classList.remove('visible'); }

  // ── Song name toast ────────────────────────────────────────────────────────
  var toast = document.createElement('div');
  toast.id = 'music-toast';
  document.body.appendChild(toast);
  var toastTimer = null;
  function showToast(msg) {
    if (!msg) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('visible'); }, 3000);
  }

  // ── Hidden player container (off-screen but rendered for ToS) ─────────────
  var wrap = document.createElement('div');
  wrap.id = 'yt-music-wrap'; // same ID kept so router.js persistence list works
  wrap.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:200px;height:80px;pointer-events:none;z-index:1;';
  var playerEl = document.createElement('div');
  playerEl.id = 'yt-music-player';
  wrap.appendChild(playerEl);
  document.body.appendChild(wrap);

  // ── State ──────────────────────────────────────────────────────────────────
  var _IFrameAPI      = null;
  var controller      = null;
  var controllerReady = false;
  var isPlaying       = false;
  var userWantsPlaying = sessionStorage.getItem('music-state') === 'playing';

  function updateBtn() {
    if (isPlaying) { btn.classList.add('playing'); showRing(); }
    else { btn.classList.remove('playing'); hideRing(); }
  }

  // ── Create Spotify controller ──────────────────────────────────────────────
  function initController(uri) {
    if (!_IFrameAPI || !uri) return;
    // Destroy previous controller if reinitialising
    controller = null;
    controllerReady = false;
    playerEl.innerHTML = '';

    _IFrameAPI.createController(playerEl, { uri: uri, width: 200, height: 80 }, function (c) {
      controller = c;
      controllerReady = true;

      c.addListener('playback_update', function (e) {
        var wasPlaying = isPlaying;
        isPlaying = !e.data.isPaused;
        updateBtn();
        // Unexpected pause rescue
        if (e.data.isPaused && userWantsPlaying) {
          setTimeout(function () {
            if (userWantsPlaying && controller && !isPlaying) {
              try { controller.play(); } catch (err) {}
            }
          }, 100);
        }
      });

      if (userWantsPlaying) {
        try { c.play(); } catch (err) {}
      }
    });
  }

  // ── Load Spotify iFrame API ────────────────────────────────────────────────
  window.onSpotifyIframeApiReady = function (IFrameAPI) {
    _IFrameAPI = IFrameAPI;
    var uri = storedUri();
    if (uri) initController(uri);
  };

  if (!document.querySelector('script[src*="spotify.com/embed/iframe-api"]')) {
    var s = document.createElement('script');
    s.src = 'https://open.spotify.com/embed/iframe-api/v1';
    document.head.appendChild(s);
  }

  // ── Toggle ─────────────────────────────────────────────────────────────────
  btn.addEventListener('click', function () {
    if (!controller || !controllerReady) {
      showToast('Set a Spotify playlist in edit mode (♪ Set)');
      return;
    }
    if (isPlaying) {
      userWantsPlaying = false;
      sessionStorage.setItem('music-state', 'paused');
      controller.pause();
    } else {
      userWantsPlaying = true;
      sessionStorage.setItem('music-state', 'playing');
      ring.style.background = makeRingGradient();
      controller.play();
    }
  });

  // ── Keep ring aligned on resize ────────────────────────────────────────────
  window.addEventListener('resize', function () { if (isPlaying) positionRing(); });

  // ── Keyboard controls ──────────────────────────────────────────────────────
  // M / MediaPlayPause     → toggle
  // . / MediaTrackNext     → next track
  // , / MediaTrackPrevious → previous track
  document.addEventListener('keydown', function (e) {
    if (!controller || !controllerReady) return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

    switch (e.code) {
      case 'KeyM':
      case 'MediaPlayPause':
        e.preventDefault();
        if (isPlaying) {
          userWantsPlaying = false;
          sessionStorage.setItem('music-state', 'paused');
          controller.pause();
        } else {
          userWantsPlaying = true;
          sessionStorage.setItem('music-state', 'playing');
          ring.style.background = makeRingGradient();
          controller.play();
        }
        break;
      case 'Period':
      case 'MediaTrackNext':
        e.preventDefault();
        userWantsPlaying = true;
        sessionStorage.setItem('music-state', 'playing');
        try { controller.nextTrack(); } catch (err) {}
        break;
      case 'Comma':
      case 'MediaTrackPrevious':
        e.preventDefault();
        userWantsPlaying = true;
        sessionStorage.setItem('music-state', 'playing');
        try { controller.previousTrack(); } catch (err) {}
        break;
    }
  });

  // ── SPA navigation recovery ────────────────────────────────────────────────
  window.addEventListener('spa-navigated', function () {
    if (!userWantsPlaying) return;
    setTimeout(function () { if (userWantsPlaying && controller && !isPlaying) { try { controller.play(); } catch (e) {} } }, 150);
    setTimeout(function () { if (userWantsPlaying && controller && !isPlaying) { try { controller.play(); } catch (e) {} } }, 600);
  });

  // ── Exposed for edit mode ──────────────────────────────────────────────────
  window._musicPlayer = {
    // uri: full Spotify URI, e.g. "spotify:playlist:37i9dQZXXX" or playlist URL
    updateUri: function (uri) {
      localStorage.setItem('music-uri', uri);
      if (controller && controllerReady) {
        try { controller.loadUri(uri); if (!isPlaying) controller.pause(); }
        catch (e) { initController(uri); }
      } else {
        initController(uri);
      }
    },
    resume: function () {
      if (userWantsPlaying && controller && controllerReady && !isPlaying) {
        try { controller.play(); } catch (e) {}
      }
    },
  };
})();
