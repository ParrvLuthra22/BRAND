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
                        SceneUnfold/SceneRail will mount their own canvases
                        here next — reuse heroShaders.ts's pattern rather
                        than duplicating the OGL setup.
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
  images: { main: string; alt: string; gallery: string[] };
  sequenceFrames?: string[]; // scroll-scrubbed sequence frame paths, if any
  description: string;
  specs: { fabric: string; cut: string; print: string };
};
```

Seeded with 6 placeholder products (2 hoodies, 4 tees). Image paths point at
`/media/images/<id>/...` — those files don't exist yet, so `ShopGrid` renders
text-only cards for now; swap in real photography and `<Image>` components
without changing the data shape.

## Homepage

`app/page.tsx` renders, in this fixed order:
`Hero → SceneUnfold → SceneRail → Manifesto → TheDrop → ShopGrid → Footer`

`Loader` is mounted separately, in `app/layout.tsx` (see below) — it isn't
part of `page.tsx`. `Hero` is fully built (see "Hero WebGL" below).
`SceneUnfold`, `SceneRail`, `Manifesto`, `TheDrop`, and `ShopGrid`/`Footer`
are still bare placeholder stubs in `components/sections/` (brand tokens
applied, no real animation/WebGL/data-fetching logic yet). `SceneUnfold` and
`SceneRail` are the next sections that will reach into `components/webgl`
(alongside `Hero`, which already does) for their own scroll-driven scenes.

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
