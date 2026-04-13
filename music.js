// music.js — ambient background music: auto-detects Spotify or YouTube from stored URI
(function () {
  if (window._musicPlayer) return;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function storedUri() { return document.body.dataset.musicUri || localStorage.getItem('music-uri') || 'DcNLfwlXGqw'; }

  function detectType(uri) {
    if (!uri) return null;
    if (uri.startsWith('spotify:') || /spotify\.com/.test(uri)) return 'spotify';
    if (/youtube\.com|youtu\.be/.test(uri) || /^[A-Za-z0-9_-]{11}$/.test(uri)) return 'youtube';
    return null;
  }

  function parseYouTube(uri) {
    // Returns { videoId, listId }
    var videoId = null, listId = null;
    var u;
    try { u = new URL(uri); } catch (e) { u = null; }
    if (u) {
      videoId = u.searchParams.get('v') || null;
      listId  = u.searchParams.get('list') || null;
      if (!videoId && u.hostname === 'youtu.be') videoId = u.pathname.slice(1);
    } else if (/^[A-Za-z0-9_-]{11}$/.test(uri)) {
      videoId = uri;
    }
    return { videoId: videoId || 'DcNLfwlXGqw', listId };
  }

  function toSpotifyUri(raw) {
    var urlMatch = raw.match(/spotify\.com\/(?:playlist|album|track)\/([A-Za-z0-9]+)/);
    if (urlMatch) {
      var type = raw.match(/spotify\.com\/(playlist|album|track)\//)[1];
      return 'spotify:' + type + ':' + urlMatch[1];
    }
    if (/^spotify:[a-z]+:[A-Za-z0-9]+$/.test(raw)) return raw;
    return null;
  }

  // ── Ring & toast ───────────────────────────────────────────────────────────
  function randColor() {
    var h = Math.random() * 360, s = 55 + Math.random() * 30, l = 72 + Math.random() * 14;
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
  }
  function makeRingGradient() {
    var c = [randColor(), randColor(), randColor(), randColor()];
    return 'conic-gradient(' + c.join(',') + ',' + c[0] + ')';
  }

  var btn = document.createElement('button');
  btn.id = 'music-btn';
  btn.setAttribute('aria-label', 'Toggle music');
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L5.5 3.5V10.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="3.5" cy="10.5" r="2" fill="currentColor"/><circle cx="11" cy="8.5" r="2" fill="currentColor"/></svg>';
  document.body.appendChild(btn);

  var ring = document.createElement('div');
  ring.id = 'music-ring';
  document.body.appendChild(ring);

  function positionRing() {
    var r = btn.getBoundingClientRect();
    ring.style.left = Math.round(r.left - (64 - r.width) / 2) + 'px';
    ring.style.top  = Math.round(r.top  - (64 - r.height) / 2) + 'px';
  }
  function showRing() { ring.style.background = makeRingGradient(); positionRing(); ring.classList.add('visible'); }
  function hideRing() { ring.classList.remove('visible'); }

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

  // ── Shared player container ────────────────────────────────────────────────
  var wrap = document.createElement('div');
  wrap.id = 'yt-music-wrap';
  wrap.style.cssText = 'position:fixed;bottom:0;left:0;width:300px;height:152px;opacity:0.001;pointer-events:none;z-index:-1;overflow:hidden;';
  var playerEl = document.createElement('div');
  playerEl.id = 'yt-music-player';
  wrap.appendChild(playerEl);
  document.body.appendChild(wrap);

  // ── State ──────────────────────────────────────────────────────────────────
  var isPlaying        = false;
  var userWantsPlaying = sessionStorage.getItem('music-state') === 'playing';
  var activeType       = null; // 'spotify' | 'youtube'

  // Spotify
  var _IFrameAPI   = null;
  var spController = null;
  var spReady      = false;

  // YouTube
  var ytPlayer     = null;
  var ytReady      = false;

  function updateBtn() {
    if (isPlaying) { btn.classList.add('playing'); showRing(); }
    else           { btn.classList.remove('playing'); hideRing(); }
  }

  // ── Spotify ────────────────────────────────────────────────────────────────
  function initSpotify(uri) {
    if (!_IFrameAPI || !uri) return;
    spController = null; spReady = false;
    playerEl.innerHTML = '';

    _IFrameAPI.createController(playerEl, { uri: uri, width: 200, height: 80 }, function (c) {
      spController = c; spReady = true;
      c.addListener('playback_update', function (e) {
        isPlaying = !e.data.isPaused;
        updateBtn();
        if (e.data.isPaused && userWantsPlaying) {
          setTimeout(function () {
            if (userWantsPlaying && spController && !isPlaying) { try { spController.play(); } catch (err) {} }
          }, 100);
        }
      });
      if (userWantsPlaying) { try { c.play(); } catch (e) {} }
    });
  }

  function ensureSpotifyApi(cb) {
    if (_IFrameAPI) { cb(); return; }
    window.onSpotifyIframeApiReady = function (api) { _IFrameAPI = api; cb(); };
    if (!document.querySelector('script[src*="spotify.com/embed/iframe-api"]')) {
      var s = document.createElement('script');
      s.src = 'https://open.spotify.com/embed/iframe-api/v1';
      document.head.appendChild(s);
    }
  }

  window.onSpotifyIframeApiReady = function (api) {
    _IFrameAPI = api;
    if (activeType === 'spotify') initSpotify(toSpotifyUri(storedUri()));
  };

  // ── YouTube ────────────────────────────────────────────────────────────────
  function initYouTube(uri) {
    playerEl.innerHTML = '';
    ytPlayer = null; ytReady = false;
    var parsed = parseYouTube(uri);

    function createPlayer() {
      var opts = {
        videoId: parsed.videoId,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: function (e) {
            ytReady = true;
            // Load a playlist for skip support: explicit list, or YouTube radio mix (RD+videoId)
            var list = parsed.listId || ('RD' + parsed.videoId);
            e.target.cuePlaylist({ list: list, listType: 'playlist' });
            if (userWantsPlaying) { e.target.playVideo(); }
          },
          onStateChange: function (e) {
            var YT = window.YT;
            if (!YT) return;
            var wasPlaying = isPlaying;
            isPlaying = (e.data === YT.PlayerState.PLAYING);
            updateBtn();
            if (isPlaying && !wasPlaying) {
              try { showToast(ytPlayer.getVideoData().title); } catch (err) {}
            }
          },
        }
      };
      ytPlayer = new window.YT.Player(playerEl, opts);
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window._ytMusicQueue = window._ytMusicQueue || [];
      window._ytMusicQueue.push(createPlayer);
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        var s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
        window.onYouTubeIframeAPIReady = function () {
          (window._ytMusicQueue || []).forEach(function (fn) { fn(); });
          window._ytMusicQueue = [];
        };
      }
    }
  }

  // ── Bootstrap from stored URI ──────────────────────────────────────────────
  function bootPlayer(uri) {
    var type = detectType(uri);
    if (!type) return;
    activeType = type;
    // Tear down whichever player is not needed
    if (type === 'spotify') {
      ytPlayer = null; ytReady = false;
      ensureSpotifyApi(function () { initSpotify(toSpotifyUri(uri)); });
    } else {
      spController = null; spReady = false;
      initYouTube(uri);
    }
  }

  var _stored = storedUri();
  if (_stored) bootPlayer(_stored);

  // ── Double-tap to skip (mobile) ────────────────────────────────────────────
  var _lastTap = 0;
  btn.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - _lastTap < 300) {
      e.preventDefault(); // suppress the click that follows
      try {
        if (activeType === 'youtube' && ytPlayer && ytReady) ytPlayer.nextVideo();
        else if (activeType === 'spotify' && spController && spReady) spController.nextTrack();
      } catch (err) {}
      ring.style.background = makeRingGradient();
      showToast('Next ›');
      _lastTap = 0;
    } else {
      _lastTap = now;
    }
  }, { passive: false });

  // ── Toggle ─────────────────────────────────────────────────────────────────
  btn.addEventListener('click', function () {
    btn.style.opacity = '0.4';
    setTimeout(function () { btn.style.opacity = ''; }, 120);

    var ready = (activeType === 'spotify' && spController && spReady) ||
                (activeType === 'youtube' && ytPlayer && ytReady);

    if (!ready) {
      if (!storedUri()) {
        showToast('Paste a Spotify or YouTube URL in edit mode (♪ Set)');
      } else {
        userWantsPlaying = true;
        sessionStorage.setItem('music-state', 'playing');
        ring.style.background = makeRingGradient();
        showToast('Connecting…');
      }
      return;
    }

    if (isPlaying) {
      userWantsPlaying = false;
      sessionStorage.setItem('music-state', 'paused');
      if (activeType === 'spotify') { try { spController.pause(); } catch (e) {} }
      else { try { ytPlayer.pauseVideo(); } catch (e) {} }
    } else {
      userWantsPlaying = true;
      sessionStorage.setItem('music-state', 'playing');
      ring.style.background = makeRingGradient();
      if (activeType === 'spotify') { try { spController.play(); } catch (e) {} }
      else { try { ytPlayer.playVideo(); } catch (e) {} }
    }
  });

  // ── Keyboard controls ──────────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
    var isToggle = e.code === 'KeyM'   || e.key === 'MediaPlayPause';
    var isNext   = e.code === 'Period' || e.key === 'MediaTrackNext';
    var isPrev   = e.code === 'Comma'  || e.key === 'MediaTrackPrevious';
    if (!isToggle && !isNext && !isPrev) return;
    e.preventDefault();
    if (isToggle) { btn.click(); return; }
    userWantsPlaying = true;
    sessionStorage.setItem('music-state', 'playing');
    if (activeType === 'spotify' && spController && spReady) {
      try { if (isNext) spController.nextTrack(); else spController.previousTrack(); } catch (e) {}
      setTimeout(function () { try { spController.play(); } catch (e) {} }, 300);
    } else if (activeType === 'youtube' && ytPlayer && ytReady) {
      try { if (isNext) ytPlayer.nextVideo(); else ytPlayer.previousVideo(); } catch (e) {}
    }
  });

  window.addEventListener('resize', function () { if (isPlaying) positionRing(); });

  window.addEventListener('spa-navigated', function () {
    if (!userWantsPlaying) return;
    setTimeout(function () {
      if (!userWantsPlaying) return;
      if (activeType === 'spotify' && spController && !isPlaying) { try { spController.play(); } catch (e) {} }
      if (activeType === 'youtube' && ytPlayer && ytReady && !isPlaying) { try { ytPlayer.playVideo(); } catch (e) {} }
    }, 150);
    setTimeout(function () {
      if (!userWantsPlaying) return;
      if (activeType === 'youtube' && ytPlayer && ytReady && !isPlaying) { try { ytPlayer.playVideo(); } catch (e) {} }
    }, 600);
  });

  // ── Exposed for edit mode ──────────────────────────────────────────────────
  window._musicPlayer = {
    updateUri: function (uri) {
      localStorage.setItem('music-uri', uri);
      bootPlayer(uri);
    },
    resume: function () {
      if (!userWantsPlaying) return;
      if (activeType === 'spotify' && spController && spReady && !isPlaying) { try { spController.play(); } catch (e) {} }
      if (activeType === 'youtube' && ytPlayer && ytReady && !isPlaying) { try { ytPlayer.playVideo(); } catch (e) {} }
    },
  };
})();
