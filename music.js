// music.js — ambient background music player
// Included on every page. YouTube IFrame API loaded here.

(function () {
  // Guard: music.js runs exactly once. The index path re-executes scripts on
  // every back-navigation — this prevents a second player from being created.
  if (window._musicPlayer) return;

  var DEFAULT_VID  = 'DcNLfwlXGqw';
  var DEFAULT_LIST = 'RDDcNLfwlXGqw';

  function storedVid()  { return localStorage.getItem('music-vid')  || DEFAULT_VID;  }
  function storedList() { return localStorage.getItem('music-list') || DEFAULT_LIST; }

  // ── Pastel color generator (same as transition splash) ────────
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

  // ── Button ─────────────────────────────────────────────────────
  var btn = document.createElement('button');
  btn.id = 'music-btn';
  btn.setAttribute('aria-label', 'Toggle music');
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L5.5 3.5V10.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="3.5" cy="10.5" r="2" fill="currentColor"/><circle cx="11" cy="8.5" r="2" fill="currentColor"/></svg>';
  document.body.appendChild(btn);

  // ── Gradient ring ──────────────────────────────────────────────
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

  function hideRing() {
    ring.classList.remove('visible');
  }

  // ── Song name toast ────────────────────────────────────────────
  var toast = document.createElement('div');
  toast.id = 'music-toast';
  document.body.appendChild(toast);
  var toastTimer = null;

  function showToast(title) {
    if (!title) return;
    // Strip YouTube junk like "Topic" and extra dashes
    var clean = title.replace(/\s*[-–—]\s*(Topic|Official.*)?$/i, '').trim();
    toast.textContent = clean;
    toast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('visible');
    }, 3000);
  }

  // ── Hidden player container (off-screen but rendered for ToS) ──
  var wrap = document.createElement('div');
  wrap.id = 'yt-music-wrap';
  wrap.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:200px;height:113px;pointer-events:none;z-index:1;';
  var playerEl = document.createElement('div');
  playerEl.id = 'yt-music-player';
  wrap.appendChild(playerEl);
  document.body.appendChild(wrap);

  // ── State ──────────────────────────────────────────────────────
  var player      = null;
  var playerReady = false;
  var isPlaying   = false;
  // Default: try to play unless user explicitly paused in this session
  var resumeIntent = sessionStorage.getItem('music-state') === 'playing';
  // Tracks user's explicit intent — not clobbered by YouTube API state events
  var userWantsPlaying = resumeIntent;

  function updateBtn() {
    if (isPlaying) {
      btn.classList.add('playing');
      showRing();
    } else {
      btn.classList.remove('playing');
      hideRing();
    }
  }

  // ── Player init ────────────────────────────────────────────────
  function initPlayer() {
    player = new YT.Player('yt-music-player', {
      host:   'https://www.youtube-nocookie.com',
      width:  200,
      height: 113,
      videoId: storedVid(),
      playerVars: {
        autoplay:       0,
        list:           storedList(),
        listType:       'playlist',
        controls:       0,
        disablekb:      1,
        fs:             0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel:            0,
        origin:         window.location.origin,
      },
      events: {
        onReady: function (e) {
          playerReady = true;
          if (resumeIntent) e.target.playVideo();
          else e.target.pauseVideo();
        },
        onStateChange: function (e) {
          var wasPlaying = isPlaying;
          isPlaying = (e.data === 1); // YT.PlayerState.PLAYING
          // Only reflect explicit user intent — not YouTube pausing on its own during SPA swaps
          if (e.data === 1) { userWantsPlaying = true; sessionStorage.setItem('music-state', 'playing'); }
          // e.data === 2 fired by button click sets userWantsPlaying=false BEFORE pauseVideo(),
          // so only save 'paused' when userWantsPlaying is already false (explicit user pause)
          if (e.data === 2 && !userWantsPlaying) { sessionStorage.setItem('music-state', 'paused'); }
          // Unexpected pause — rescue immediately
          if (e.data === 2 && userWantsPlaying) {
            setTimeout(function () { if (userWantsPlaying && player && playerReady && !isPlaying) player.playVideo(); }, 80);
          }
          updateBtn();
          // Show song name when playback starts (not on resume from same state)
          if (isPlaying && !wasPlaying) {
            setTimeout(function () {
              try {
                var data = player.getVideoData();
                showToast(data && data.title);
              } catch (err) {}
            }, 600);
          }
        },
        onError: function () {
          // Radio mix may be restricted — fall back to single-video loop
          if (!player) return;
          if (isPlaying) player.loadVideoById({ videoId: storedVid() });
          else player.cueVideoById({ videoId: storedVid() });
        },
      },
    });
  }

  // ── Load YouTube IFrame API ────────────────────────────────────
  if (window.YT && window.YT.Player) {
    initPlayer();
  } else {
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (prev) prev();
      initPlayer();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }

  // ── Toggle ─────────────────────────────────────────────────────
  btn.addEventListener('click', function () {
    if (!player || !playerReady) return;
    if (isPlaying) {
      userWantsPlaying = false; // set intent BEFORE pauseVideo fires onStateChange
      sessionStorage.setItem('music-state', 'paused');
      player.pauseVideo();
    } else {
      userWantsPlaying = true;
      sessionStorage.setItem('music-state', 'playing');
      ring.style.background = makeRingGradient();
      player.playVideo();
    }
  });

  // ── Keep ring aligned on resize ───────────────────────────────
  window.addEventListener('resize', function () {
    if (isPlaying) positionRing();
  });

  // ── Keyboard controls ──────────────────────────────────────────
  // M         → toggle play / pause
  // . (period) → skip to next track
  // , (comma)  → skip to previous track
  document.addEventListener('keydown', function (e) {
    if (!player || !playerReady) return;
    // Leave modifier combos (Ctrl+S, Alt+←, etc.) untouched
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    // Don't intercept while typing in any text field
    var active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

    switch (e.code) {
      case 'KeyM':
        e.preventDefault();
        if (isPlaying) {
          userWantsPlaying = false;
          sessionStorage.setItem('music-state', 'paused');
          player.pauseVideo();
        } else {
          userWantsPlaying = true;
          sessionStorage.setItem('music-state', 'playing');
          ring.style.background = makeRingGradient();
          player.playVideo();
        }
        break;
      case 'Period':
        e.preventDefault();
        userWantsPlaying = true;
        sessionStorage.setItem('music-state', 'playing');
        player.nextVideo();
        break;
      case 'Comma':
        e.preventDefault();
        userWantsPlaying = true;
        sessionStorage.setItem('music-state', 'playing');
        player.previousVideo();
        break;
    }
  });

  // ── Watchdog: polls every 150ms — resumes on any non-playing state ───────
  function tryResume() {
    if (!userWantsPlaying || !player || !playerReady) return;
    try {
      var s = player.getPlayerState();
      // 1 = playing, 3 = buffering (leave alone). Everything else → resume.
      if (s !== 1 && s !== 3) player.playVideo();
    } catch (e) {}
  }
  setInterval(tryResume, 150);

  // ── After every SPA navigation, fire multiple recovery attempts ───────────
  // Covers the window where GSAP/Lenis re-init can nudge YouTube into pausing.
  window.addEventListener('spa-navigated', function () {
    if (!userWantsPlaying) return;
    setTimeout(tryResume, 50);
    setTimeout(tryResume, 200);
    setTimeout(tryResume, 500);
    setTimeout(tryResume, 900);
  });

  // ── Exposed for edit mode URL update ──────────────────────────
  window._musicPlayer = {
    updateUrl: function (vid, list) {
      localStorage.setItem('music-vid',  vid);
      localStorage.setItem('music-list', list);
      if (player && playerReady) {
        player.loadPlaylist({ list: list, listType: 'playlist', index: 0, startSeconds: 0 });
        if (!isPlaying) player.pauseVideo();
      }
    },
    // Called by router after every SPA swap to restore play state
    resume: function () {
      if (userWantsPlaying && player && playerReady && !isPlaying) {
        player.playVideo();
      }
    },
  };
})();
