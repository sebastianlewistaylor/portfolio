// music.js — ambient background music player
// Included on every page. YouTube IFrame API loaded here.

(function () {
  var DEFAULT_VID  = 'DcNLfwlXGqw';
  var DEFAULT_LIST = 'RDDcNLfwlXGqw';

  function storedVid()  { return localStorage.getItem('music-vid')  || DEFAULT_VID;  }
  function storedList() { return localStorage.getItem('music-list') || DEFAULT_LIST; }

  // ── Button ─────────────────────────────────────────────────────
  var btn = document.createElement('button');
  btn.id = 'music-btn';
  btn.setAttribute('aria-label', 'Toggle music');
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L5.5 3.5V10.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="3.5" cy="10.5" r="2" fill="currentColor"/><circle cx="11" cy="8.5" r="2" fill="currentColor"/></svg>';
  document.body.appendChild(btn);

  // ── Hidden player container (off-screen but rendered for ToS) ──
  var wrap = document.createElement('div');
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
  var resumeIntent = sessionStorage.getItem('music-state') !== 'paused';

  function updateBtn() {
    if (isPlaying) {
      btn.classList.add('playing');
    } else {
      btn.classList.remove('playing');
    }
  }

  // ── Player init ────────────────────────────────────────────────
  function initPlayer() {
    player = new YT.Player('yt-music-player', {
      width: 200,
      height: 113,
      videoId: storedVid(),
      playerVars: {
        autoplay:       1,
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
          isPlaying = (e.data === 1); // YT.PlayerState.PLAYING
          sessionStorage.setItem('music-state', isPlaying ? 'playing' : 'paused');
          updateBtn();
        },
        onError: function () {
          // Radio mix may be restricted — fall back to single-video loop
          if (player) {
            player.loadVideoById({ videoId: storedVid() });
          }
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
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  });

  // ── Exposed for edit mode URL update ──────────────────────────
  window._musicPlayer = {
    updateUrl: function (vid, list) {
      localStorage.setItem('music-vid',  vid);
      localStorage.setItem('music-list', list);
      if (player && playerReady) {
        player.loadPlaylist({ list: list, listType: 'playlist', index: 0, startSeconds: 0 });
        player.playVideo();
      }
    },
  };
})();
