# Ignition Hero

A six-second WebGL2 entry hero. A line of charcoal handwriting draws the
visitor's name; the line ignites at the tail; flame travels backward,
eating the stroke; embers and smoke rise. The brand mark and tagline fade
in as the burn settles. One verb: *ignite*.

Plays once per session.

## Integration

```html
<!-- In <head> -->
<link rel="stylesheet" href="/components/ignition-hero/styles.css">
<link rel="preload" href="/brand/mark.svg" as="fetch" crossorigin="anonymous">

<!-- Where the hero should land -->
<section id="ignition" data-ignition-host></section>

<!-- Before </body> -->
<script type="module">
  import { mount, prefetch } from '/components/ignition-hero/index.js';
  prefetch();   // warm the brand SVG and font
  mount(document.querySelector('[data-ignition-host]'), {
    name: 'Sebastian Taylor',
    role: 'Designer · Developer',
    tagline: 'For Bonfire Labs · 05.2026',
    markUrl: '/brand/mark.svg',
  });
</script>
```

## Brand contract

The hero reads CSS custom properties from `:root`. Define these on the page:

| Token | Fallback |
|---|---|
| `--brand-bg` | `#0A0908` |
| `--brand-ink` | `#1A1612` |
| `--brand-text` | `#E8E0D4` |
| `--brand-muted` | `#6B5640` |
| `--brand-muted-alt` | `#3D3328` |
| `--brand-accent` | `#B8804A` |
| `--brand-font-display` | `Georgia, serif` |
| `--brand-font-mono` | `JetBrains Mono, ui-monospace, monospace` |

The brand mark SVG must use `currentColor` for fills, contain no internal
animations, and weigh ≤ 4kB. If the contract is not met, the hero falls
back to brand text only.

The fire palette (`FIRE_CORE/MID/TAIL/SMOKE`) is locked to a blackbody
approximation in `shaders/burn.frag`. It is physics, not brand — do not
override.

## API

```ts
mount(el: HTMLElement, opts: {
  name: string;
  role?: string;
  tagline?: string;
  markUrl?: string;     // default './brand/mark.svg'
  onComplete?: () => void;
  forcePlay?: boolean;  // ignore session-played flag (dev only)
}): { destroy(): void };

prefetch(opts?: { markUrl?: string }): Promise<void>;
```

## Resilience

| Failure | Behavior |
|---|---|
| WebGL2 unavailable | Resting state shown immediately. Telemetry: `hero.webgl_unavailable`. |
| Brand SVG fetch fails | Text-only resting state. Telemetry: `hero.mark_fetch_failed`. |
| Font load > 1500ms | Proceed in fallback font. Telemetry: `hero.font_load_timeout`. |
| Reduced motion | Resting state with 200ms fade. Telemetry: `hero.reduced_motion`. |
| Already played this session | Resting state. No log. |
| Tab backgrounded mid-burn | rAF + timeline both paused; resume on visible. |
| Context lost | One restore attempt; otherwise jump to resting state. |
| JS disabled | `<noscript>` renders `fallback.svg`. |

## Telemetry

Best-effort calls to `window.specimen.track(event, props)`. No-op if absent.

| Event | Trigger |
|---|---|
| `hero.mounted` | Always |
| `hero.font_loaded` | Font load resolved or timed out |
| `hero.completed` | After full reveal |
| `hero.skipped` | Early-exit path taken |
| `hero.error` | Any caught error |
| `hero.brand_token_missing` | Per missing CSS variable |
| `hero.mark_fetch_failed` | Mark SVG could not load |
| `hero.webgl_unavailable` | WebGL2 context creation failed |
| `hero.context_lost` | `webglcontextlost` event |
| `hero.frame_budget_violation` | Long-task p95, reported once after run |

## Determinism

All randomness flows from `mulberry32(SEED)`. Given the same viewport,
DPR, brand tokens, name, and seed, two machines render identical frames.
QA captures reference frames and asserts ≤ 0.5% pixel diff.

The seed `SEED = 0xB0FF12E` is the closest valid hex spelling of the
intended `0xB0FF1RE` glyph. If you change it, re-bake all reference
images.

## Build / deviation note

The on-disk shader files at `shaders/burn.{vert,frag}` are the source of
truth for the GPU code. Because this component ships with no build step,
they are also mirrored as template strings in `scene.js`. If you edit the
shaders, edit both copies. (A trivial `tools/sync-shaders.mjs` script can
automate the mirror in a watched build.)

## Performance notes

- Shaders never iterate JS-side; all per-pixel work is in the fragment
  program with ~12 ALU + 3 texture samples.
- Stroke texture is rasterized at most every ~33ms during the draw phase
  and exactly once at hold/burn (no per-frame `getImageData`).
- Embers and smoke are noise-field driven — no JS particle arrays.
- The render loop drives uniforms only; the timeline mutates a single
  `state` object that the loop reads without per-frame allocation.

## Out of scope

Replay UI, controls, sound, mouse interactivity, names > 18 characters,
non-Latin scripts. See spec §18.
