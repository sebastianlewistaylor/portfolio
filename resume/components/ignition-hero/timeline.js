// Tiny pausable timeline. Time-based, deterministic — all decisions read
// from accumulated `t` (ms since logical start), never directly from
// performance.now() at the callsite. Pause/resume preserves the local
// clock so backgrounded tabs don't burn the animation while invisible.
//
// API:
//   const tl = new Timeline();
//   tl.at(t_ms, () => { ... }).range(t0, t1, (p_eased) => { ... }, ease);
//   tl.onComplete(() => {}).start();
//   tl.pause(); tl.resume(); tl.cancel();

export const easeInOutCubic = t =>
  t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
export const easeOutQuart   = t => 1 - Math.pow(1 - t, 4);
export const easeOutQuad    = t => 1 - (1 - t) * (1 - t);
export const linear         = t => t;

export class Timeline {
  constructor(){
    this.events  = [];   // { t, fn, fired }
    this.ranges  = [];   // { t0, t1, fn, ease, done }
    this._raf    = 0;
    this._t0     = 0;
    this._paused = 0;
    this._pausedAt = 0;
    this._done   = false;
    this.t       = 0;
    this._onDone = null;
  }
  at(t, fn){ this.events.push({ t, fn, fired: false }); return this; }
  range(t0, t1, fn, ease = linear){
    this.ranges.push({ t0, t1, fn, ease, done: false }); return this;
  }
  duration(){
    let d = 0;
    for (const e of this.events) d = Math.max(d, e.t);
    for (const r of this.ranges) d = Math.max(d, r.t1);
    return d;
  }
  onComplete(fn){ this._onDone = fn; return this; }

  _tick(now){
    this.t = (now - this._t0) - this._paused;
    for (const e of this.events){
      if (!e.fired && this.t >= e.t){ e.fired = true; e.fn(this.t); }
    }
    for (const r of this.ranges){
      if (r.done) continue;
      if (this.t < r.t0) continue;
      if (this.t >= r.t1){ r.fn(1, this.t); r.done = true; }
      else {
        const p = (this.t - r.t0) / (r.t1 - r.t0);
        r.fn(r.ease(p), this.t);
      }
    }
    if (this.t >= this.duration()){
      this._raf = 0;
      if (!this._done){
        this._done = true;
        if (this._onDone) this._onDone();
      }
      return;
    }
    this._raf = requestAnimationFrame(this._tick.bind(this));
  }

  start(){
    if (this._done) return this;
    this._t0 = performance.now();
    this._raf = requestAnimationFrame(this._tick.bind(this));
    return this;
  }
  pause(){
    if (!this._raf || this._pausedAt) return;
    this._pausedAt = performance.now();
    cancelAnimationFrame(this._raf); this._raf = 0;
  }
  resume(){
    if (this._raf || !this._pausedAt) return;
    this._paused += performance.now() - this._pausedAt;
    this._pausedAt = 0;
    this._raf = requestAnimationFrame(this._tick.bind(this));
  }
  cancel(){
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._done = true;
  }
}
