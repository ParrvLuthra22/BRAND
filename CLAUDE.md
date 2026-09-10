# BRAND

Experimental, award-tier streetwear site (oversized tees & hoodies). Aesthetic
reference: KidSuper / Serotoninn — immersive, editorial, a little hostile.

**Spectacle is front-loaded, commerce stays fast.** The homepage hero + two
scroll scenes (`SceneUnfold`, `SceneRail`) carry the WebGL/shader/scroll-jack
budget. Everything past that — PDP, cart, checkout — must stay fast and clean.
**Never add WebGL, shaders, or scroll-jacking to PDP or cart.**

## Stack

- Next.js 15 (App Router, TypeScript, `next dev`/`build` on Turbopack), no
  `src/` dir — `app/`, `components/`, `lib/`, `data/` all live at the repo root.
- Tailwind CSS v4 (CSS-first config via `@theme` in `app/globals.css` — there
  is no `tailwind.config.ts`).
- ESLint 9 flat config via `FlatCompat` (see "ESLint" below).
- Package manager: npm (`package-lock.json` is committed).

## Packages and why they're here

| Package | Purpose |
|---|---|
| `lenis` | Smooth scroll, driven by GSAP's ticker. |
| `gsap` (+ `ScrollTrigger`) | Scroll-driven animation for the two spectacle scenes. |
| `framer-motion` | Component-level transitions/gestures (not scroll choreography). |
| `zustand` | Cart store (`lib/cart-store.ts`). |
| `ogl` | Minimal WebGL for the shader work in `components/webgl` — no Three.js. |
| `embla-carousel-react` | SceneRail's mobile carousel only — desktop never touches it. |
| `clsx` + `tailwind-merge` | `cn()` helper in `lib/utils.ts`. |

## Lenis + GSAP ScrollTrigger wiring

`lib/lenis.tsx` exports `LenisProvider`, mounted once in `app/layout.tsx`
around `{children}`. It:

1. Creates one `Lenis` instance (`lerp: 0.1`, `wheelMultiplier: 1`,
   `syncTouch: false`). **Lenis renamed the old `smoothTouch` option to
   `syncTouch`** — `syncTouch: false` is the current equivalent (native touch
   scrolling, not synced/smoothed). If you see `smoothTouch` referenced
   anywhere (docs, AI suggestions, old snippets), translate it to `syncTouch`.
2. Drives Lenis from `gsap.ticker` (not its own `requestAnimationFrame` loop)
   so GSAP and Lenis share one clock, and sets `gsap.ticker.lagSmoothing(0)`.
3. Registers a `ScrollTrigger.scrollerProxy(document.body, ...)` so
   ScrollTrigger reads scroll position from Lenis instead of the native
   scrollbar.

**Known footgun (already hit and fixed once — do not reintroduce):** on
`ScrollTrigger`'s `"refresh"` event, call `lenis.resize()`, **never**
`ScrollTrigger.refresh()`. Calling `ScrollTrigger.refresh()` inside its own
`"refresh"` listener re-fires the event and blows the call stack
(`Maximum call stack size exceeded`) on first load.

Any component using `ScrollTrigger` should import the shared, already-
registered instance from `lib/gsap.ts` (`import { gsap, ScrollTrigger } from
"@/lib/gsap"`) rather than importing `gsap`/`gsap/ScrollTrigger` directly —
that file is what calls `gsap.registerPlugin(ScrollTrigger)` exactly once.

Use `useLenis()` (from `lib/lenis.tsx`) to get the active Lenis instance in a
client component, e.g. for `lenis.scrollTo(...)`.

## Design tokens (`app/globals.css`)

All tokens live in one `@theme` block. **Treat these as the single source of
truth — don't hardcode hex values or durations in components.**

```
--color-bg: #0A0A0A          --color-bg-raised: #141414
--color-concrete: #2A2A2A    --color-paper: #F2F0EB
--color-muted: #8A8A85       --color-line: #2E2E2E
--color-acid: #C6FF00        --color-acid-dim: #9BC900
--color-sale: #FF3B00
--font-display: "Clash Display", sans-serif
--font-body: "Space Grotesk", sans-serif
--font-mono: "Space Mono", monospace
--ease-out: cubic-bezier(0.16, 1, 0.3, 1)
```

Use them as Tailwind utilities: `bg-bg`, `text-paper`, `text-acid`,
`border-line`, `font-display`, `ease-[var(--ease-out)]`, etc. `--ease-out`
intentionally **overrides** Tailwind's built-in `ease-out` utility — every
`ease-out` in this codebase is this custom curve, not the Tailwind default.

**Color rules — do not violate:**
- **Acid green (`acid`/`acid-dim`) is the one brand accent**: CTAs, active
  states, kinetic/hover highlights. It doesn't share visual weight with
  anything else.
- **Hot-orange (`sale`) is reserved for sale/urgency only** (strikethrough
  MRP, "sale" badges, countdown timers). Never use it for a CTA, a link, or
  any non-urgency accent — it must never compete with acid for attention.
- Brutalist: **sharp corners everywhere**. All `--radius-*` tokens are
  zeroed in `@theme`. The one exception is pill CTAs, which use
  `rounded-full` (Tailwind implements this outside the radius scale, so it
  still works and is the only rounded shape in the system).

### Fonts

- **Clash Display** (`--font-display`) is self-hosted via `@font-face` in
  `app/globals.css`, pointing at `/public/fonts/ClashDisplay-{Regular,
  Medium,Semibold,Bold}.woff2`. **Those files are not in the repo** (Clash
  Display is a free-for-commercial-use font from Fontshare but redistributing
  the binary here isn't appropriate) — download it from Fontshare and drop
  the four `.woff2` files into `public/fonts/` with those exact names before
  the real typeface shows up; until then it silently falls back to
  `sans-serif`.
- **Space Grotesk** (`--font-body`) and **Space Mono** (`--font-mono`) load
  via `next/font/google` in `app/layout.tsx` as `--font-space-grotesk` /
  `--font-space-mono`, then `app/globals.css` re-points the `--font-body` /
  `--font-mono` theme tokens at those actual loaded variables (with the
  human-readable family name kept only as a fallback). If you add weights,
  add them to the `next/font` call in `app/layout.tsx`, not by hand.

### Type scale (fluid)

Defined under `--text-*` in `@theme`, so they're plain Tailwind font-size
utilities — `text-hero`, `text-display`, `text-h2`, `text-h3`, `text-body`,
`text-caption`, `text-mono`. Line-height and `-0.03em` letter-spacing (both
`hero` and `display` — the wordmark scale needs it at least as much as
section headlines) are baked into each token via Tailwind v4's
`--text-{name}--line-height` / `--text-{name}--letter-spacing` sibling
convention — you don't need to set either manually when using these.

```
hero     clamp(4rem, 18vw, 20rem)     — tracking -0.03em
display  clamp(2.5rem, 8vw, 7rem)   — tracking -0.03em
h2       clamp(1.75rem, 4vw, 3rem)
h3       clamp(1.25rem, 2.5vw, 1.75rem)
body     clamp(1rem, 1.1vw, 1.125rem)
caption  0.8125rem
mono     0.75rem
```

For mono labels (eyebrow text, prices, nav), use the `mono-label` utility
(`@utility mono-label` in `globals.css`) which composes `font-mono` +
`text-mono` + `uppercase` + `tracking-mono` (0.08em) in one class — don't
hand-assemble `font-mono uppercase tracking-[0.08em]` inline.

### Motion

```
--dur-fast: .4s   --dur-med: .8s   --dur-slow: 1.2s
```

Plain CSS custom properties (no Tailwind namespace maps to them), consumed
as `duration-[var(--dur-fast)]` in Tailwind classes, or read directly in
GSAP/Framer Motion configs in `lib/`. Keep any hardcoded duration numbers in
`lib/gsap.ts`-style configs in sync with these values by eye — GSAP can't
read CSS custom properties automatically.

`app/globals.css` has a global `prefers-reduced-motion: reduce` block that
zeroes `animation-duration`, `transition-duration`, and forces
`scroll-behavior: auto`. Lenis additionally honors `prefers-reduced-motion`
itself by default (`respectReducedMotion`, forces `lerp: 1`) — you don't need
to special-case Lenis on top of the CSS block.

## Structure

```
app/                    routes (App Router)
components/ui/          small shared primitives (Grain, buttons, etc.)
components/sections/    homepage/PDP section-level components
components/webgl/       ogl/WebGL shader + image-sequence components.
                        HeroCanvas.tsx + heroShaders.ts back the Hero's
                        displacement shader (see "Hero WebGL" below).
                        SceneUnfoldCanvas.tsx draws SceneUnfold's scroll-
                        scrubbed image sequence to a plain Canvas2D context
                        (no WebGL — see "SceneUnfold" below). RailTransition
                        Canvas.tsx is SceneRail's shared between-items
                        transition overlay — reuses heroShaders.ts directly
                        (see "SceneRail" below).
lib/gsap.ts             shared gsap + ScrollTrigger export (registers the plugin once)
lib/lenis.tsx           LenisProvider + useLenis()
lib/loader.ts           loader session/event contract + real asset preloading
lib/utils.ts            cn() (clsx + tailwind-merge)
lib/cart-store.ts       zustand cart store
data/products.ts        Product type + seed catalog
public/media/           images/, sequence/ (scroll-scrubbed frames), video/
public/fonts/           self-hosted Clash Display woff2s (not committed yet)
```

## Product data (`data/products.ts`)

```ts
type Product = {
  id: string;
  name: string;
  moodLine: string;       // exactly three UPPERCASE words, e.g. "HEAVY. CROPPED. RELENTLESS."
  priceMRP: number;       // cents
  priceSale?: number;     // cents; only set when the item is discounted
  colorway: string;
  sizes: string[];
  images: {
    main: string; alt: string; gallery: string[];
    cutout: string;   // transparent PNG, garment isolated — SceneRail's floating cutout
    backdrop: string; // full-bleed plate behind it in SceneRail
  };
  sequenceFrames?: string[]; // scroll-scrubbed sequence frame paths, if any
  description: string;
  specs: { fabric: string; cut: string; print: string };
};
```

Seeded with 6 placeholder products (2 hoodies, 4 tees). Image paths point at
`/media/images/<id>/...` — those files don't exist yet, so `ShopGrid` renders
text-only cards for now; swap in real photography and `<Image>` components
without changing the data shape. `cutout`/`backdrop` are populated for all 6
(via the `railImages(id)` helper) since all 6 appear in `SceneRail`.

`hoodie-blackout` is the one product with `sequenceFrames` populated — 60
paths at `/media/sequence/frame_0001.webp` … `frame_0060.webp`, generated by
the `sequenceFrames(count)` helper in that file — it's the featured product
for `SceneUnfold`'s reveal (see below). None of those files exist yet either;
`SceneUnfold`'s preloader resolves on 404 the same way image preloading does
elsewhere in this codebase. If you add real photography, 60 frames at real
production quality is a lot of payload for an eager preload — consider
trimming the count (30–40 is usually enough for a smooth scrub) once real
assets replace these.

## Homepage

`app/page.tsx` renders, in this fixed order:
`Hero → SceneUnfold → SceneRail → Manifesto → TheDrop → ShopGrid → Footer`

`Loader` is mounted separately, in `app/layout.tsx` (see below) — it isn't
part of `page.tsx`. `Hero`, `SceneUnfold`, and `SceneRail` are fully built
(see their own sections below). `Manifesto`, `TheDrop`, and `ShopGrid`/
`Footer` are still bare placeholder stubs in `components/sections/` (brand
tokens applied, no real animation/data-fetching logic yet).

## Loader → Hero handoff

`Loader` (`components/sections/Loader.tsx`) is mounted once in
`app/layout.tsx`, not in `app/page.tsx`. That placement matters: the root
layout doesn't remount on client-side route changes, so the loader mounts
exactly once per hard navigation and never replays when navigating between
routes client-side.

- **Session gating**: `lib/loader.ts` exports `hasLoaderPlayed()` /
  `markLoaderPlayed()`, backed by `sessionStorage` (`brand:loader-played`).
  On mount, `Loader` checks this in a `useLayoutEffect` (before paint, so
  there's never a flash) — if already played this session (e.g. a hard
  refresh after the intro already ran), it renders nothing and immediately
  calls `dispatchLoaderComplete()` so `Hero` isn't left waiting forever.
- **Real preloading, not a fake timer**: `getCriticalPreloadTargets()` in
  `lib/loader.ts` lists the hero image, the first `SceneUnfold` sequence
  frame (standing in for "hero video" until Hero has one), and the two
  critical font weights. `Loader` runs them through `Promise.all`, and the
  0→100% counter is `resolvedCount / total`, updated as each one resolves —
  never a `setInterval`/fake-progress timer. Every individual loader
  (`preloadImage`/`preloadFont`) resolves on both success AND failure (`img
  .onerror` / `.catch()`), so a 404 (real today — `/public/media` and the
  Clash Display woff2s aren't committed yet) can never hang the gate.
- **Glitch tied to real progress**: the RGB-split wordmark's jitter
  amplitude is `MAX_OFFSET * (1 - progress/100)` — it's driven by the same
  load progress as the counter, not a separate fixed-length animation, so it
  always finishes converging exactly when loading finishes.
- **The handoff event**: on completion, `Loader` calls `markLoaderPlayed()`
  then `dispatchLoaderComplete()` (fires `window` `CustomEvent`
  `LOADER_COMPLETE_EVENT` = `"brand:loader-complete"`) and starts its
  mask-wipe (`clip-path` animation) in the same tick — Hero's intro and the
  wipe run concurrently, not sequentially. `Hero` listens for that event to
  start its own intro, **but only if it hasn't already checked
  `hasLoaderPlayed()` and started immediately** — this dual path is what
  makes Hero correct both on first load (waits for the event) and after a
  client-side route change back to `/` (loader doesn't remount/fire again,
  so Hero must self-start via the session flag instead).
- **Reduced motion**: checked once via `matchMedia` in the same
  pre-paint `useLayoutEffect`. Reduced-motion skips the RGB-split glitch
  layers entirely (renders the plain wordmark) and replaces the mask-wipe
  with a fast plain-opacity fade. Preloading still runs for real either way —
  reduced motion changes the animation, not the gating.

Any future component that needs "has the intro finished" should use the same
pair (`hasLoaderPlayed()` fast-path + `LOADER_COMPLETE_EVENT` listener) that
`Hero` uses, not just one or the other.

## Hero WebGL (`components/webgl/HeroCanvas.tsx` + `heroShaders.ts`)

`Hero` renders a fullscreen OGL canvas behind its overlay content: a single
fullscreen-triangle mesh (`ogl`'s `Triangle` geometry needs no camera) with a
custom fragment shader doing cover-fit UV mapping, noise-based liquid
displacement that follows a lerped pointer position, chromatic aberration
that eases in on hover, film grain, and a vignette. `heroShaders.ts` holds
the GLSL verbatim — treat it as hand-authored source, not something to
"clean up"; `SceneRail`'s planned displacement pass should reuse this same
program with smaller `amt`/`ca` rather than duplicating it.

- **Uniforms**: `uTexture`, `uMouse` (lerp factor 0.08, range -0.5..0.5),
  `uTime`, `uHover` (tweened 0↔1 over 0.6s via `EASE_OUT` on
  pointerenter/leave), `uResolution`, `uImageSize`. `uHover` is tweened by
  calling `gsap.to()` directly on the uniform object's `value` — GSAP can
  tween any plain object property, not just DOM styles.
- **DPR is capped** at `Math.min(devicePixelRatio, 2)` when constructing the
  `Renderer`.
- **Lazy/lifecycle-correct**: everything (Renderer/Program/Mesh/Texture,
  listeners, rAF loop) is created in one `useEffect` and torn down in its
  cleanup — `cancelAnimationFrame`, disconnect the `ResizeObserver` and
  `IntersectionObserver`, remove pointer listeners, `gsap.killTweensOf` the
  hover uniform, and `gl.getExtension('WEBGL_lose_context')?.loseContext()`.
  The `IntersectionObserver` starts/stops the rAF loop as the hero scrolls
  in/out of view.
- **Context loss**: a `webglcontextlost` listener calls `preventDefault()`
  (per spec, without it the browser won't even attempt recovery), stops the
  rAF loop, and calls the `onError` prop — Hero treats that exactly like
  "no WebGL" and swaps to the `<img>` fallback. This isn't theoretical: a
  backgrounded/hidden tab is a real trigger for the GPU process reclaiming
  contexts (confirmed while building this — `document.hidden` was `true` in
  the dev browser tab used to test it, and the context was lost within a few
  seconds). Never try to resume rendering on the same lost context — the
  compiled program and uploaded texture are gone with it; falling back is
  simpler and correct.
- **Fallback conditions** (`Hero`, not `HeroCanvas`, decides these): no
  WebGL support, `prefers-reduced-motion: reduce`, or "mobile-lite" (coarse
  pointer **and** `max-width: 767px` — both together, so a wide touch
  laptop still gets WebGL). Checked once in a pre-paint `useLayoutEffect`
  with the same SSR-safe-default pattern as the loader/reduced-motion checks
  elsewhere: `useState(false)` (matches server + first client render, so no
  hydration mismatch) upgraded synchronously before paint.

### yPercent vs. a CSS transform class — do not reintroduce

The wordmark's mask-reveal (`Hero`'s `<h1>`, animated via `gsap.set`/`.to`
with `yPercent`) **must not** get its pre-JS hidden state from a Tailwind
transform utility class (e.g. `translate-y-full`). This was a real bug hit
while building Hero: with the class present, GSAP's transform parser reads
the class-driven `translate: 0 100%` as part of the element's initial
*computed* `transform`, caches that as a frozen pixel `y` baseline, and then
never reconciles it with the animated `yPercent` — the tween's `onUpdate`
and `onComplete` fire correctly and `gsap.getProperty(el, "yPercent")`
reports the right values throughout, but the actual painted `transform`
never changes. The element silently never appears, with no error.

The fix: let GSAP own the element's transform state from the very first
paint. `Hero`'s top-level `useLayoutEffect` calls
`gsap.set(wordmarkRef.current, { yPercent: 100 })` directly — no CSS class
establishes any transform on that element, ever. This is safe pre-loader-
complete because the Loader overlay is still covering the page at that
point anyway. If you add another `yPercent`/`xPercent`-animated element,
follow the same pattern: no static transform-utility class, seed the hidden
state via `gsap.set` instead. Plain pixel `y`/`x` and `autoAlpha` (used for
the eyebrow/moodline/scroll cue) don't have this problem — only the
percent-based transform properties parse a pre-existing computed transform
this way.

### `EASE_OUT` (`lib/gsap.ts`)

`lib/gsap.ts` now also registers `CustomEase` and defines `EASE_OUT =
"brandOut"`, an SVG-path equivalent of the `--ease-out` design token
(`cubic-bezier(0.16, 1, 0.3, 1)` → `"M0,0 C0.16,1 0.3,1 1,1"`). GSAP's core
`ease` option can't parse a raw CSS `cubic-bezier()` string, so this is the
one registered, reusable way to get that exact curve in GSAP tweens —
import `EASE_OUT` from `@/lib/gsap` and pass it as `ease: EASE_OUT` rather
than approximating with a named GSAP ease (`power3.out` etc.) or
hand-rolling another `CustomEase.create` call elsewhere.

## SceneUnfold (`components/sections/SceneUnfold.tsx` + `components/webgl/SceneUnfoldCanvas.tsx`)

The signature pinned, scroll-scrubbed reveal. `SceneUnfold.tsx` owns
preloading, the reduced-motion split, and the GSAP timeline; `SceneUnfoldCanvas.tsx`
is a generic "draw an image sequence to canvas, scrubbed by an external
progress getter" component with no GSAP/ScrollTrigger knowledge of its own —
reuse it (or its pattern) for `SceneRail`.

- **Data source**: `hoodie-blackout` in `data/products.ts` is the featured
  product — see "Product data" above for its `sequenceFrames`.
- **Preload gates the pin**: `preloadSequence()` kicks off on mount (so for
  a homepage section it's normally long finished before the user scrolls
  this far) and only once every frame has loaded (or 404'd — see below)
  does `ready` flip true. The pinned `ScrollTrigger` is created only after
  `ready`; before that, the section is a plain unpinned `h-screen` block
  showing a minimal `mono-label` "Loading" — normal scroll, no scroll-
  jacking, if someone outscrolls the preload.
- **Canvas drawing is manual, not GSAP-driven**: `SceneUnfoldCanvas` runs
  its own `requestAnimationFrame` loop (mirroring `HeroCanvas`'s pattern —
  same `IntersectionObserver` start/stop gating) that reads
  `getProgress()` fresh every frame and only redraws when the mapped frame
  *index* actually changes. Don't switch this to a GSAP `onUpdate` callback
  — a manual rAF loop is what keeps scrubbing smooth on fast scroll instead
  of being limited to however often ScrollTrigger's update events fire.
  `getProgress` **must** be a stable callback (`useCallback(() =>
  progressRef.current, [])`, reading a ref) — same reasoning as `HeroCanvas`'s
  `onError`: an inline arrow here would re-run the canvas's whole setup
  effect on every unrelated `SceneUnfold` re-render.
- **One timeline drives the pin AND the other three effects together**:
  `gsap.timeline({ scrollTrigger: { trigger, pin: true, scrub: true, ... } })`
  — the headline sweep, background color shift, and mask-wipe are all
  tweened at timeline position `0` (simultaneous, per spec), with
  `ease: "none"` since a scrubbed timeline should track scroll position
  directly — Lenis already supplies the smoothing, so any additional GSAP
  ease here would just add a second, competing lag. `scrub` is `true`
  (direct 1:1), not a numeric value, for the same reason.
- **Never call `ScrollTrigger.refresh()` right after creating a fresh
  pin.** This was hit while building this: calling it immediately after
  `gsap.timeline({ scrollTrigger: { pin: true, ... } })` snapped the page's
  scroll position elsewhere (ScrollTrigger reconciling the pinned element's
  progress against the document height that its own new pin spacer had
  just changed). A freshly created `ScrollTrigger` already measures current
  layout as part of creation — `.refresh()` is only for making *existing*
  triggers re-measure after something else changed. If a future scene
  needs a manual refresh, don't reach for it reflexively; confirm first
  that something has actually gone stale.
- **`xPercent`/`yPercent` still needs GSAP to own the transform** (see the
  Hero section above for the mechanism), but the fix doesn't always have to
  be `gsap.set` — the headline here seeds its hidden state via a plain
  inline `style={{ transform: "translateX(120%)" }}`, which is safe because
  it writes the same `transform` property GSAP itself animates. What's
  unsafe is specifically a Tailwind transform-utility *class*
  (`translate-x-full` etc.), because those set the separate standalone
  `translate` CSS property, which is what confuses GSAP's parser. Inline
  `style` on `transform` directly, or `gsap.set`, are both fine.
- **Reduced motion**: no pin, ever. A short (1.2s) one-time GSAP tween of a
  plain `{ value }` object from `0` to `frameCount - 1` plays through the
  sequence once, the first time the section intersects the viewport
  (`IntersectionObserver`, `threshold: 0.2`, guarded by a ref so it never
  replays), then rests on the final frame — which doubles as the "static
  composed image" end state. The mask starts fully revealed and the
  headline starts at its resting (centered) position — no travel, matching
  how `Hero` and `Loader` already snap straight to end-state under reduced
  motion instead of animating a simplified version of the same journey.

## SceneRail (`components/sections/SceneRail.tsx` + `components/webgl/RailTransitionCanvas.tsx`)

Horizontal-scroll product reveal — all 6 `products` in a row. Renders one of
three genuinely different trees depending on mode, decided once in a
pre-paint `useLayoutEffect` (same SSR-safe-default pattern as everywhere
else: `useState<RailMode>("mobile")` matches server + first client render,
upgraded before paint):

1. **`reduced`** (`prefers-reduced-motion`, checked first — wins over the
   viewport check below) — a plain `overflow-x-auto` + `snap-x` row. No JS
   library, no pin, native scroll only.
2. **`mobile`** (`max-width: 767px`, checked once, no resize listener —
   same simplification Hero's mobile-lite check already makes) — Embla
   (`useEmblaCarousel({ align: "start" })`) driving a normal swipeable
   track. Embla owns horizontal drag *inside its own container*; it never
   touches page scroll, so this satisfies "don't scroll-jack on mobile"
   structurally, not just by disabling the pin.
3. **`desktop`** — the real thing: `gsap.timeline({ scrollTrigger: { pin:
   true, scrub: true, ... } })` pins the section and translates
   `trackRef`'s `x` by `-(itemCount - 1) * window.innerWidth` across the
   scroll range, landing each item full-viewport in turn.

`reduced` and `mobile` share the exact same per-item markup via the local
`RailCard` component (backdrop img + cutout img + moodline + Explore pill,
no refs needed) — only their outer scroll container differs. `desktop`'s
per-item markup is written out separately in `SceneRail` itself because it
needs `backdropRefs`/`cutoutRefs` arrays for parallax; don't try to
unify it with `RailCard` just to reduce duplication, the ref requirement is
a real structural difference.

- **Parallax** (desktop only): backdrop and cutout images each get their
  own small `fromTo(el, { xPercent: ±N }, { xPercent: ∓N, ease: "none" },
  0)` tween on the *same* timeline as the main track translation — same
  scrub, so backdrop drifts one way and cutout the other as you scroll
  through each item, layered on top of the shared horizontal travel.
- **Between-items transition, reusing Hero's OGL program**:
  `RailTransitionCanvas` is a *single* shared WebGL overlay (one canvas, one
  context, `pointer-events-none`, `z-20` above the track) — not one canvas
  per item. It imports `heroFragmentShader`/`heroVertexShader` from
  `heroShaders.ts` directly, unmodified. Every rAF tick it computes, from
  the rail's own scroll progress: `trackPosition = progress * (itemCount -
  1)`, `nearestIndex = Math.round(trackPosition)` (which backdrop texture
  to bind — switches exactly at each boundary), and a smoothstepped
  `transition` value (0 centered on an item, 1 exactly at the midpoint
  between two). `transition` drives both the canvas's own `opacity`
  (invisible at rest, revealing the plain DOM backdrop underneath — it only
  fades in during the pulse) and `uHover = transition * 0.35` — the `0.35`
  cap is the "weaker params" the task asked for; the shader source itself
  is untouched. The texture swap happens exactly when the pulse is at
  peak distortion, so the swap is masked rather than visible as a cut.
  Reuse this same pattern (shared overlay + progress-driven `uHover` cap)
  rather than a fresh per-canvas approach for any future between-item
  transition.
- **Not gated behind a loading state**: unlike `SceneUnfold`, the pin is
  created immediately — it doesn't depend on image dimensions the way
  frame-index drawing does. Backdrop images preload in the background purely
  for the WebGL overlay's texture; if they're not ready yet, the overlay
  (already invisible at rest) just has nothing to show, which is fine.
- **`Explore` links point at `/product/<id>`** — that route doesn't exist
  yet (no PDP built). This is deliberate structure-ahead-of-content, same
  as the product image paths pointing at files that don't exist yet.

## ESLint

`eslint.config.mjs` uses `FlatCompat` (from `@eslint/eslintrc`, an explicit
devDependency) to load `next/core-web-vitals` + `next/typescript`, because
`eslint-config-next@15.x` still ships the legacy `.eslintrc`-shaped config
(`{ extends: [...] }`), not a native flat-config array. Don't replace this
with a direct `import nextVitals from "eslint-config-next/core-web-vitals"`
spread — that only works with `eslint-config-next@16+`, and this project is
pinned to Next.js 15.

## Commands

```
npm run dev     # Turbopack dev server
npm run build   # production build (runs typecheck + lint)
npm run lint    # eslint .
```
