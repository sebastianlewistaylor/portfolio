// Entry Gate — vestibule that wraps the landing page.
//
//   mount(gateEl, { siteEl, burnName, burnTagline?, markUrl? })
//
// Behavior:
//   1. Gate covers viewport. Site below is opacity:0.
//   2. Show pre-ignition copy. Listen for motion signal:
//        pointermove (>40px/s for 200ms), deviceorientation (>6° delta),
//        touchstart, or any keydown.
//   3. First signal wins. Fade copy, mount Ignition Hero in eg-stage,
//      passing the signal-source as telemetry context.
//   4. On Ignition Hero completion: dissolve gate (opacity 0, 800ms),
//      reveal site (.revealed → opacity 1, 600ms). Remove gate from DOM
//      ~700ms after dissolve start. Set sessionStorage 'gate.passed' = '1'.
//   5. If gate.passed === '1' on load → reveal site immediately, no gate.
//   6. If prefers-reduced-motion → skip burn; show one-frame post-burn
//      still for 1.2s, then dissolve.

import { mount as mountIgnition } from '../ignition-hero/index.js';

const SESSION_KEY = 'gate.passed';

function track(event, props){
  try { window.specimen?.track?.(event, props || {}); } catch(_){ /* never throw */ }
}

function revealSite(siteEl){
  if (!siteEl) return;
  siteEl.classList.add('revealed');
}

export function mount(gateEl, opts = {}){
  if (!gateEl) throw new Error('entry-gate: gate element missing');
  const {
    siteEl,
    burnName    = 'specimen',
    burnTagline = '',
    markUrl     = '',
    onComplete,
  } = opts;

  const reduceMotion  = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const alreadyPassed = sessionStorage.getItem(SESSION_KEY) === '1';

  // ── EARLY EXIT: already passed this session ────────────────────
  if (alreadyPassed){
    track('gate.skipped', { reason: 'already_passed' });
    gateEl.hidden = true;
    revealSite(siteEl);
    if (onComplete) try { onComplete(); } catch(_){}
    return { destroy(){ gateEl.remove(); } };
  }

  // ── DOM scaffold ───────────────────────────────────────────────
  gateEl.innerHTML = `
    <div class="eg-stage" data-eg-stage></div>
    <div class="eg-copy" data-eg-copy>
      <div class="eg-top">
        <p class="eg-mark">specimen</p>
        <p class="eg-sub">not a public site</p>
      </div>
      <p class="eg-hint">move to enter</p>
    </div>
  `;
  const stage = gateEl.querySelector('[data-eg-stage]');
  const copy  = gateEl.querySelector('[data-eg-copy]');

  let opened = false;
  let pmStart = 0, pmDist = 0, lastX = 0, lastY = 0;

  function dissolveGate(){
    gateEl.classList.add('eg-dissolving');
    requestAnimationFrame(() => revealSite(siteEl));
    setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      gateEl.remove();
      if (onComplete) try { onComplete(); } catch(_){}
      track('gate.completed', {});
    }, 850);
  }

  function open(source){
    if (opened) return;
    opened = true;
    track('gate.opened_by', { source });
    cleanupSignals();

    // Fade pre-ignition copy 200ms before ignition flash.
    copy.dataset.fading = '1';

    if (reduceMotion){
      // Single frame still — skip the burn, hold 1.2s, then dissolve.
      track('gate.reduced_motion');
      setTimeout(dissolveGate, 1200);
      return;
    }

    // Mount the Ignition Hero inside the gate stage. The hero's own
    // onComplete fires after its 7.4s timeline; we then dissolve.
    // forcePlay: true — gate is the gate; the once-per-session decision
    // lives at this layer, not inside ignition.
    mountIgnition(stage, {
      name:      burnName,
      role:      '',
      tagline:   burnTagline,
      markUrl:   markUrl,
      forcePlay: true,
      onComplete: dissolveGate,
    });
  }

  // ── Motion-signal listeners ────────────────────────────────────
  function onPointerMove(e){
    const now = performance.now();
    if (!pmStart){
      pmStart = now; lastX = e.clientX; lastY = e.clientY; pmDist = 0;
      return;
    }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    pmDist += Math.hypot(dx, dy);
    lastX = e.clientX; lastY = e.clientY;
    const elapsed = now - pmStart;
    if (elapsed >= 200){
      const v = pmDist / (elapsed / 1000);
      if (v > 40) open('pointer');
      // Reset window
      pmStart = now; pmDist = 0;
    }
  }
  function onDeviceOrientation(e){
    const a = Math.abs(e.alpha || 0) - (deviceOrientBase.alpha || 0);
    const b = Math.abs(e.beta  || 0) - (deviceOrientBase.beta  || 0);
    const g = Math.abs(e.gamma || 0) - (deviceOrientBase.gamma || 0);
    if (a > 6 || b > 6 || g > 6) open('tilt');
  }
  const deviceOrientBase = { alpha: null, beta: null, gamma: null };
  function onDeviceOrientationFirst(e){
    deviceOrientBase.alpha = e.alpha || 0;
    deviceOrientBase.beta  = e.beta  || 0;
    deviceOrientBase.gamma = e.gamma || 0;
    window.removeEventListener('deviceorientation', onDeviceOrientationFirst);
    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
  }
  function onTouchStart(){ open('touch'); }
  function onKeyDown(){ open('key'); }

  function cleanupSignals(){
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('deviceorientation', onDeviceOrientation);
    window.removeEventListener('deviceorientation', onDeviceOrientationFirst);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('keydown', onKeyDown);
  }

  // Activate listeners after a small delay so we don't fire on the same
  // pointermove event that brought the user to the page.
  setTimeout(() => {
    if (opened) return;
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchstart',  onTouchStart,  { passive: true });
    window.addEventListener('keydown',     onKeyDown);
    if ('DeviceOrientationEvent' in window){
      window.addEventListener('deviceorientation', onDeviceOrientationFirst, { passive: true, once: true });
    }
  }, 600);

  track('gate.mounted', { reduced_motion: reduceMotion });

  return {
    destroy(){
      cleanupSignals();
      gateEl.remove();
    },
  };
}
