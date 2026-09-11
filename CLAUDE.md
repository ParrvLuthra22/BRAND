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
| `framer-motion` | Component-level transitions/gestures (not scroll choreography) — Manifesto's `whileInView` line reveals, ProductCard's hover tilt, and every global overlay's enter/exit (CartDrawer, CaptureModal, the PDP lightbox). |
| `zustand` | `lib/cart-store.ts` (persisted to localStorage — see "Global commerce UI") and `lib/capture-modal-store.ts`, both the same tiny isOpen/open/close overlay-state shape. |
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
app/                    routes (App Router). app/products/[id]/page.tsx is
                        the PDP — see "Product Detail Page" below.
components/ui/          small shared primitives. Grain, TopNav, CartDrawer,
                        and CaptureModal are mounted globally in
                        app/layout.tsx, like Loader (see "Global commerce
                        UI" below). ProductCard and ProductImage are
                        different — not globally mounted, plain reusable
                        components (see "ShopGrid" below); they're here
                        rather than components/sections/ because they're
                        reused across sections, not tied to one.
components/sections/    homepage/PDP section-level components. ProductOverview,
                        SpecStory, ProductFAQ, and RelatedProducts are the
                        PDP's — see "Product Detail Page" below.
components/webgl/       ogl/WebGL shader + image-sequence components.
                        HeroCanvas.tsx + heroShaders.ts back the Hero's
                        displacement shader (see "Hero WebGL" below).
                        SceneUnfoldCanvas.tsx draws SceneUnfold's scroll-
                        scrubbed image sequence to a plain Canvas2D context
                        (no WebGL — see "SceneUnfold" below). RailTransition
                        Canvas.tsx is SceneRail's shared between-items
                        transition overlay — reuses heroShaders.ts directly
                        (see "SceneRail" below). Never PDP/cart — those stay
                        WebGL-free by design, see the top of this file.
lib/gsap.ts             shared gsap + ScrollTrigger export (registers the plugin once)
lib/lenis.tsx           LenisProvider + useLenis()
lib/loader.ts           loader session/event contract + real asset preloading
lib/utils.ts            cn() (clsx + tailwind-merge), EASE_OUT (framer-motion
                        bezier array version of lib/gsap.ts's EASE_OUT), and
                        formatPrice() (cents -> "$X.XX", shared by CartDrawer/
                        TheDrop/ProductCard/ProductOverview)
lib/cart-store.ts       zustand cart store, persisted to localStorage
lib/capture-modal-store.ts  zustand isOpen/open/close for CaptureModal
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
  soldOut?: boolean;      // only set true when out of stock
  hook: string;           // one punchy standalone line — the PDP's headline
  useCase: string;        // one line grounding it in an actual moment of wear
  colorway: string;
  sizes: string[];
  images: {
    main: string; alt: string; gallery: string[];
    cutout: string;   // transparent PNG, garment isolated — SceneRail's floating cutout
    backdrop: string; // full-bleed plate behind it in SceneRail
    details?: { fabric: string; print: string; stitch: string }; // optional, see below
  };
  sequenceFrames?: string[]; // scroll-scrubbed sequence frame paths, if any
  description: string;
  specs: { fabric: string; cut: string; print: string };
};
```

Seeded with 6 products: **`onyx-hoodie` is the one real product** (real
photography, the featured product everywhere — see below); the other 5
(1 hoodie, 4 tees) are still placeholders, image paths pointing at
`/media/images/<id>/...` files that don't exist yet, so every `<img>` for
them (`ShopGrid`/`ProductCard` included) renders a broken-image icon, same
as `TheDrop` and `SceneRail`; swap in real photography and `<Image>`
components without changing the data shape. `cutout`/`backdrop` are
populated for all 6 (via the `railImages(id)` helper for the 5 placeholders;
written out explicitly for `onyx-hoodie`, see its own comment) since all 6
appear in `SceneRail`.

**`onyx-hoodie`'s real assets live under
`/public/media/images/products/onyx-hoodie/`** — note the extra `products/`
segment, a different shape than the placeholders' `/media/images/<id>/...`
convention. Its image paths are written out as literals in `data/products.ts`
rather than through `railImages()`, which still targets the old,
`products/`-less shape for the 5 placeholders (deliberately — don't "fix"
that helper to match, the placeholders are untouched on purpose). If more
real product photography arrives, drop it under
`/media/images/products/<id>/...` and follow `onyx-hoodie`'s explicit-literal
pattern, not `railImages()`'s.

`onyx-hoodie`'s `gallery` deliberately repeats `main`/`alt` ahead of its two
real extra shots (`detail-cuff.jpg`, `flatlay.jpg`) — `[main, alt,
detail-cuff, flatlay]` — matching "PDP gallery: images.gallery in order" as
given. `ProductOverview`'s `galleryFor()` dedupes by `src` so this doesn't
produce duplicate PDP thumbnails (see "Product Detail Page" below). It has
no `backdrop` (not delivered) — a placeholder path in the same real-asset
folder, 404s gracefully like everything else not-yet-real.

`soldOut` is `true` for exactly one seed product (`hoodie-concrete`) so
`ProductCard`'s disabled state has something to render against — every
other product is implicitly in stock (field absent, not `false`).

`hook`/`useCase` are unconditionally required (unlike the optional fields
above) — every product needs PDP copy, there's no "featured product only"
carve-out here the way there is for `sequenceFrames`. Both are hand-written
per product, matching that product's `moodLine` tone (see the seed data) —
not derived from other fields, since a punchy one-liner isn't something you
can template. `onyx-hoodie`'s task brief didn't specify these two (they're
this codebase's own addition, from before real assets existed) — written to
match its "washed/quiet" mood rather than the louder pieces' tone.

**`details` is currently unpopulated for every seed product** — it used to
carry `hoodie-blackout`'s (the old placeholder, now replaced by
`onyx-hoodie`) 3-key fabric/print/stitch shots, which `TheDrop`'s detail
panels and `SpecStory`'s `chapterImage()` both read. `TheDrop` no longer
depends on it at all (see "TheDrop" below); `SpecStory` still checks it via
optional chaining and falls through to `gallery`/`main`/`alt` when absent,
which is now the path every product actually takes. Left in the type as a
future affordance, not dead weight to clean up reflexively — see its own
type comment.

`onyx-hoodie` is the one product with `sequenceFrames` populated — it's the
featured product for both `SceneUnfold`'s reveal and `TheDrop` (see below).
`sequenceFrames` is 60 paths at `/media/sequence/frame_0001.webp` …
`frame_0060.webp`, generated by the `sequenceFrames(count)` helper in that
file. **None of those frame files exist yet** — real photography exists for
`onyx-hoodie`'s stills, but not yet for the scroll-scrubbed sequence, so
`SceneUnfold`'s preloader still resolves every frame on 404, same as before.
If you add the real frames, 60 at production quality is a lot of payload for
an eager preload — consider trimming to 30–40 once they exist.

## Homepage

`app/page.tsx` renders, in this fixed order:
`Hero → SceneUnfold → SceneRail → Manifesto → TheDrop → ShopGrid → Footer`

`Loader` is mounted separately, in `app/layout.tsx` (see below) — it isn't
part of `page.tsx`. `Hero`, `SceneUnfold`, `SceneRail`, `Manifesto`,
`TheDrop`, and `ShopGrid` are fully built (see their own sections below).
`Footer` is minimal but no longer a stub — name, copyright line, and a
"Join the Cult" button that opens `CaptureModal` (see "Global commerce UI").

`TopNav`, `CartDrawer`, and `CaptureModal` (all `components/ui/`) are
mounted globally in `app/layout.tsx`, not in `page.tsx` — they persist
across every route (homepage and the PDP alike), mirroring `Loader`'s
mount-once-in-the-layout placement (see below). Full detail in "Global
commerce UI".

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
- **`HERO_IMAGE_SRC`** (`lib/loader.ts`) is `/media/images/hero/hero.jpg` —
  the real photo (tall portrait, subject centered, head starting ~22% down
  the frame, empty background above it). Used as both the WebGL plane's
  texture and the `<img>` fallback's `src`.
- **The hero photo renders at full resolution, natural aspect ratio, no
  crop and no shrink-to-fit — the section itself is however tall that
  makes it, not `h-screen`.** Went through three iterations while wiring
  `hero.jpg` in, each on request as the previous one turned out not to be
  what was wanted:
  1. `object-cover` (fills one viewport edge to edge, cropping whatever
     doesn't fit), crop anchored to the image's top rather than centered —
     `hero.jpg`'s tall aspect ratio (~0.56) means a *centered* cover-crop
     actively cuts the subject's head off on any wide/short viewport (most
     laptop windows), so this was a real bug fix at the time.
  2. `object-contain` (the full image fits inside one viewport,
     letterboxed on whichever axis has room to spare) — no longer cropped,
     but still shrunk down to fit one screen, which on a wide viewport made
     the figure quite small.
  3. **Current**: no `object-fit` at all. The image/canvas is a normal
     block-flow element sized `w-full` with `h-auto` (or, for the WebGL
     path, an explicit `aspect-[941/1672]` — see below) — at full viewport
     width, `hero.jpg`'s tall crop renders far taller than one screen
     (roughly 1.78× the viewport width), so the section runs to several
     screens of ordinary scroll. Not a pin/scroll-jack — Hero has no
     ScrollTrigger at all — just a tall image in normal flow that you
     scroll past like any other content. The overlay copy (eyebrow,
     wordmark, mood line, scroll cue) is a *separate* layer,
     `absolute inset-x-0 top-0 h-screen`, pinned to exactly the first
     screen regardless of how tall the image section is, so it reads as
     "copy over the top of a tall photo," not stretched across the whole
     scroll span.
  - `<img>` fallback (`Hero.tsx`): explicit `width={941} height={1672}`
    attributes (hero.jpg's real dimensions, avoids layout shift before it
    loads) plus `className="... h-auto w-full"`.
  - WebGL: `HeroCanvas`'s wrapping container gets `aspect-[941/1672] w-full`
    instead of the old `absolute inset-0` (which needed an already-sized,
    `h-screen` ancestor) — `HeroCanvas` itself reads its container's actual
    size via `ResizeObserver` (unchanged), so giving it a correctly-shaped,
    non-circular box is all that's needed. Because the container's aspect
    ratio now always matches the image's own (both are 941:1672, by
    construction), `heroShaders.ts`'s `containUv()` (added for iteration 2,
    kept unchanged for iteration 3) degrades to an identity mapping — no
    cropping *or* letterboxing math actually does anything anymore, which
    is correct: there's nothing left to fit, the container already is the
    image's shape.
  - **Still not independently visually verified on the WebGL path** (see
    the IntersectionObserver/rAF gotchas elsewhere in this doc — WebGL
    didn't activate in this browser-automation tab through any of the three
    iterations, same root cause). Reasoned from the `<img>` fallback's
    confirmed-correct behavior (DOM-measurement-verified at a 1512×775
    window: section height ≈2660px, ≈3.4 screens, image fills full width)
    and `HeroCanvas`'s pre-existing, unchanged resize/sizing logic.

**Gotcha — a negative `z-index` on a `position:relative` element is not
the same as one on `position:absolute`, and swapping the image from
absolute to static (iteration 3, above) broke exactly this.** The image/
canvas has **no position and no z-index at all** now — plain `block`, first
in DOM order. This was a real bug, not a stylistic choice: `-z-10` on a
`position:relative` element makes *that element* establish a new stacking
context (any positioned element gets one once its `z-index` is a number,
not `auto`), and where that context resolves depends on ancestors —
without `Hero`'s own `isolate` (added specifically for this), it could
land behind unrelated content up the tree instead of just behind its own
section, and did: the photo went fully invisible (confirmed by a real
screenshot) while the text overlay rendered fine on top of it. The fix has
two parts: the image itself dropped `relative -z-10` entirely — a plain
static element already paints behind any `position:absolute` sibling that
comes after it in DOM order, no z-index needed — and the tint/overlay
divs after it dropped their own `-z-[5]`/`z-10` too, since a negative
z-index on *them* would have had the opposite effect for the same reason
(negative-z positioned descendants paint *before* normal static content,
so a `-z-[5]` tint would end up behind the now-static image, not in front
of it). `Hero`'s `isolate` stays as cheap insurance against this whole
category of bug recurring, even with zero negative z-indices left inside
it. If a future change to this section needs to re-introduce layered
`position:absolute`/`-z-*` elements, remember: z-index ordering is only
simple when everything being ordered is positioned — mixing a static
element into that stack changes the rules.
- **The wordmark's size didn't need to change again for this iteration** —
  it's still the bespoke vh-based clamp from the `object-contain` round,
  `text-[clamp(2.5rem,9vh,7rem)]` (not `--text-hero`, whose 18vw-driven max
  of 20rem would still overflow a sane headroom budget on desktop widths).
  The *reasoning* changed, though: headroom is no longer "the image fills
  viewport height" (that was `contain`-specific) but "the image fills
  viewport width, and a wider viewport makes the whole image — head
  position included — proportionally taller too," so the ~22%-down head
  position converts to more headroom pixels on a wider screen, never less.
  Verified this still holds at 1512×775 (head lands ~585px down, comfortably
  past the wordmark's few-hundred-px height). This is a deliberate, narrow
  exception to "use the design tokens" — `--text-hero` stays as-is for any
  future use that isn't constrained by this specific photo's composition.

**Hero briefly had a `<video>` background (first screen only, the
editorial campaign loop) — removed on request.** It worked correctly
(full-bleed, autoplaying) but reading the video cutting to the tall photo
mid-screen didn't look good next to the "just the photo" version that
came before, so it was pulled back out entirely — no video element, no
related state, in `Hero.tsx` at all now. The loop itself wasn't wasted:
it moved to `Manifesto` instead (see that section below), which doesn't
have Hero's "must show the whole photo, uncropped" constraint. One
lesson from the detour is worth keeping even though the Hero code that
hit it is gone: seeing it explained here first is what caught it
correctly, on the first try, when the video was rebuilt in `Manifesto` —
see "Gotcha — replaced elements and `inset-x-0`" in that section.

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

- **Data source**: `onyx-hoodie` in `data/products.ts` is the featured
  product (found dynamically via `products.find(p =>
  p.sequenceFrames?.length)` — not a hardcoded id, so this needs no code
  change when the featured product changes, only the data) — see "Product
  data" above for its `sequenceFrames`.
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

**Gotcha — frame resolution needs to match how big the canvas actually
draws them, not just "reasonably sized."** The real onyx-hoodie frames
were first extracted at 1080px wide (downscaled from the 1280×720 source);
on screen they looked visibly soft. Root cause: `SceneUnfoldCanvas` draws
every frame at the *canvas's* physical pixel size — viewport width × up to
2 DPR, often 3000px+ — via `drawImage`'s built-in scaling, so a 1080px
source was being stretched ~2.8×. Fixed two ways: re-extracted the frames
at the source's *native* 1280×720 (dropping the downscale — there's a hard
ceiling here, the source video itself is only 720p, so this narrows the
upscale but can't eliminate it), and set `ctx.imageSmoothingQuality =
"high"` in `SceneUnfoldCanvas.tsx` (defaults to `"low"` in some browsers,
which made the unavoidable remaining upscale look worse than it needed
to). If a future sequence still looks soft after both, the source footage
itself needs to be higher resolution — no amount of extraction/rendering
tuning manufactures detail the camera didn't capture.

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
- **`Explore` links point at `/products/<id>`** (plural — matches the real
  PDP route, `app/products/[id]/page.tsx`; see "Product Detail Page" below).
  These links predate the PDP and originally pointed at the singular
  `/product/<id>`, deliberate structure-ahead-of-content at the time; they
  were corrected to the plural route once the PDP actually shipped.

## Manifesto (`components/sections/Manifesto.tsx`)

Full-bleed near-black brand statement — no CTA, no product data, no GSAP.
Deliberately one of the simplest sections in the file: two lines of
display type, a marquee, grain, and (now) a dim ambient video loop behind
all of it.

- **Line reveal is a real framer-motion `whileInView`**, not GSAP — the one
  place in this codebase scroll-driven animation isn't ScrollTrigger. Each
  line is `overflow-hidden` wrapping a `motion.p` that starts at `y:"100%"`
  and animates to `y:"0%"`, `viewport={{ once: true, amount: 0.6 }}`,
  staggered by `delay: i * 0.12`. Uses `lib/utils.ts`'s `EASE_OUT` (a raw
  bezier array) — not `lib/gsap.ts`'s `EASE_OUT` (a registered CustomEase
  string), the two are not interchangeable, see the comment on each.
- **Reduced motion**: `useReducedMotion()` (framer-motion's own hook, not the
  codebase's usual manual `matchMedia` check) swaps `initial` to `false` so
  the lines render straight at `y:"0%"` with no animation.
- **Marquee is pure CSS**, no JS: `MarqueeGroup` repeats
  `"TAKE UP SPACE —"` 6 times, rendered twice back-to-back (second copy
  `aria-hidden`) inside a track with `.animate-marquee`
  (`app/globals.css` — `translateX(0) → translateX(-50%)`, `24s linear
  infinite`). Translating exactly one copy's width (`-50%` of the doubled
  track) is what makes the loop seamless — if you change `MARQUEE_REPEAT`
  or the phrase, both copies still need to be identical for this to hold.
  Automatically neutralized under `prefers-reduced-motion` by the existing
  global animation-duration override in `globals.css`, no extra code needed.
- **Heavy grain**: `.grain-heavy` (`app/globals.css`) is the same noise
  SVG data-URI as the global `.grain-overlay` (`components/ui/Grain.tsx`)
  at higher opacity (0.14 vs 0.05) and section-scoped (`position: absolute`
  inside the section, which needs `position: relative`) rather than
  viewport-fixed.
- **Ambient background video**: `MANIFESTO_LOOP_WEBM_SRC`/
  `MANIFESTO_LOOP_MP4_SRC` (`lib/loader.ts`, webm-then-mp4 `<source>`s),
  `autoPlay muted loop playsInline`, kept at `opacity-30` — this is the
  same editorial campaign loop `Hero` tried first (see "Hero briefly had a
  `<video>` background" in the Hero WebGL section above for why it moved).
  It fits here specifically because Manifesto has no "must show the whole
  frame uncropped" constraint the way Hero's rotation photo does, and the
  brief already calls for this to read as "near-black... heavy grain" —
  opacity-30 composited over the section's own `bg-bg` keeps it there;
  don't brighten it just because a video is technically visible now, the
  point is felt motion, not a bright video section. Skipped entirely under
  `useReducedMotion()` (framer-motion's hook, matching the line-reveal
  above, not a manual `matchMedia` check). `z-0`, not `-z-10` or unset —
  deliberately avoiding the negative-z-index-on-`position:relative` bug
  documented in the Hero WebGL section (that gotcha is about *negative*
  values specifically; positive/zero values compared among direct siblings
  don't have the same escape-the-section risk, so no `isolate` needed
  here). Placed first in DOM, before `.grain-heavy` and the text — `.grain-
  heavy`'s explicit `z-index: 10` always paints above it regardless of DOM
  order; the text's explicit `z-0` ties with the video's own `z-0` and
  falls back to DOM order, which is why the video needs to come first.

**Gotcha — replaced elements (`<video>`, `<img>`) ignore `inset-x-0`'s
implied width if you don't also set an explicit `width`.** Hit while
building this: with only `absolute inset-0`, a *non-replaced* box (a
plain `div`) stretches to fill automatically — every other `inset-0` in
this codebase up to now was exactly that. `<video>`/`<img>` don't: with
`width` at `auto`, they size to their own intrinsic aspect ratio instead
(this loop's source is a portrait 1080×1920 clip), and `right`/the
opposite edge is effectively ignored. Fix here is explicit `h-full
w-full` alongside `object-cover`, not `inset-0` alone. Same root cause as
the version of this bug hit (and fixed the same way) while this video was
still living in `Hero` — see that section's note.

**Gotcha — IntersectionObserver does not fire in this repo's browser
automation tab.** While building this section, `whileInView` (and the
`useInView` hook — same underlying mechanism, tried as a diagnostic
detour) never visually triggered when testing live via
`mcp__claude-in-chrome__*`. Traced to the automation tab itself, not the
code: even a bare `new IntersectionObserver(cb, { threshold: 0 })` against
`document.body` never calls `cb` in that tab, because the tab is never
truly visible/focused (`document.hidden: true`, `document.hasFocus():
false`). This is the same class of environment limitation as the WebGL
context-loss and `requestAnimationFrame`-throttling gotchas noted
elsewhere in this doc — GSAP ScrollTrigger is unaffected (it polls scroll
position, it doesn't use an observer), which is why `TheDrop`'s mask-wipes
below tested fine in the same session while this section's reveal
appeared "broken." If `whileInView`/`useInView` ever looks inert while
testing in this environment, suspect the tab before suspecting the code.

## TheDrop (`components/sections/TheDrop.tsx`)

The featured-product hero section — `FEATURED` is hardcoded to
`products.find(p => p.id === "onyx-hoodie")`, the real product (see
"Product data" above). Two-column grid:

- **Sticky product image**: left column is
  `md:sticky md:top-20 md:h-[calc(100vh-5rem)]` holding `product.images.main`
  — plain CSS sticky, works because Lenis scrolls the real document (not a
  transform-virtualized one), same reason native `position: sticky` already
  works cleanly elsewhere in this codebase. The `top-20`/`calc(...)` offset
  (not `top-0`/`h-screen`) exists because of `TopNav` — see "Global commerce
  UI"'s "Sticky columns vs. TopNav" note.
- **Detail-shot mask wipes are GSAP ScrollTrigger, one-shot per panel** —
  same mechanism as always (`clipPath: inset(0% 0% 100% 0%)` seeded inline,
  `ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter:
  () => gsap.to(el, { clipPath: "inset(0% 0% 0% 0%)", ...EASE_OUT-eased })
  })`, reduced motion skips straight to the revealed clip) — but **now only
  2 panels, not 3**: `DETAILS` is a plain `{ src, label }[]` reading
  `product.images.gallery[2]`/`[3]` (`onyx-hoodie`'s real `detail-cuff.jpg`/
  `flatlay.jpg`) directly, not keyed off `images.details.{fabric,print,
  stitch}` the way it used to be — that field is unpopulated for every seed
  product now (see "Product data" above). Don't reintroduce a 3-key
  `images.details` dependency here; if a future featured product needs a
  third panel, just add a third `{ src, label }` entry.
- **"Fabric / Cut / Print" spec-as-story is a separate, new block** — a
  plain 3-column (`sm:grid-cols-3`) text row reading straight from
  `product.specs.{fabric,cut,print}`, sitting between the purchase info and
  the two detail panels. No dedicated imagery of its own (deliberately —
  the two real detail shots right below already carry the visual weight);
  this is TheDrop's lighter, homepage-teaser echo of the PDP's `SpecStory`
  (full chapters, its own imagery, mask-wipe reveals — see "Product Detail
  Page" below), not a duplicate of it.
- **Price block**: sale price (`text-sale`) and MRP (`text-muted
  line-through`) render side by side when `product.priceSale` is set,
  falling back to a single plain price otherwise; "Incl. of all taxes"
  renders as a `mono-label` caption underneath regardless.
- **Size selector**: pills over `product.sizes`, defaults to `"M"` if the
  product carries it, else `product.sizes[0]`. Selection is local
  component state (`selectedSize`), not persisted anywhere until Add to
  Cart is clicked.
- **Add to Cart → cart store → drawer**: `handleAddToCart()` calls
  `addItem(product, selectedSize)` then `open()`, both straight off
  `useCartStore` (`lib/cart-store.ts`) — no local cart state of its own,
  same shared `CartDrawer` destination as `ProductCard`/`ProductOverview`
  (see "Global commerce UI" below for the drawer itself).

## ShopGrid (`components/sections/ShopGrid.tsx`) + ProductCard (`components/ui/ProductCard.tsx`)

`ShopGrid` maps every product in `data/products.ts` through `ProductCard` —
a responsive grid (`grid-cols-2` mobile, `md:grid-cols-3`, `lg:grid-cols-4`),
titled "Shop the Drop". `ProductCard` is built once, here, and is meant to
be the only place this card's markup/behavior is defined — reuse it as-is
for any future rail or PDP upsell section rather than rebuilding a
look-alike; nothing else currently consumes it (`SceneRail`'s `RailCard` is
a deliberately different, spectacle-oriented card and is not a candidate
for unification — see "SceneRail" above).

- **Staggered reveal is GSAP ScrollTrigger, not framer-motion** — same
  one-shot per-element pattern as `TheDrop`'s detail panels
  (`ScrollTrigger.create({ trigger: el, start: "top 90%", once: true,
  onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, ... }) })`, one trigger
  per card), *not* a `whileInView` container/stagger. This keeps the
  package boundary in "Packages and why they're here" intact — framer-motion
  stays component-level (`ProductCard`'s tilt, `Manifesto`'s line reveal),
  GSAP stays the scroll-choreography tool. Each card's hidden state is
  seeded via inline `style={{ opacity: 0, transform: "translateY(32px)" }}`
  — plain inline `style` on `transform`, not a Tailwind transform-utility
  class, for the same reason called out in the Hero/SceneUnfold sections
  above. Cards enter row-by-row as they naturally cross the trigger line;
  a small `(i % 4) * 0.06` delay adds a subtle stagger without hard-coding
  which responsive breakpoint's column count is active.
- **`ProductCard`'s image crossfade is plain CSS opacity**, not
  framer-motion — two absolutely-positioned `<img>`s (`images.main` /
  `images.alt`) cross-fade via `transition-opacity duration-[var(--dur-fast)]`,
  toggled by a single `showAlt` boolean. On desktop that boolean flips on
  `onMouseEnter`/`onMouseLeave`; on touch it flips on tap instead
  (`onClick`) — which input mode is active is decided once via
  `matchMedia("(pointer: coarse)")` in a pre-paint `useLayoutEffect`, the
  same SSR-safe-default pattern used for Hero's mobile-lite check.
- **Tilt is the one real framer-motion gesture here**: `rotateX`/`rotateY`
  motion values (wrapped in `useSpring` for the settle-back feel), driven by
  cursor position relative to the card in `onMouseMove`, capped at
  `MAX_TILT = 6` degrees, reset to `0` on `onMouseLeave`. Skipped entirely
  (handler no-ops) when touch is active or `useReducedMotion()` is true —
  the same framer-motion hook `Manifesto` uses, not a manual `matchMedia`
  check, since this is a framer-motion-owned effect.
- **Sale badge vs. sold-out state are independent, data-driven flags** —
  `priceSale` truthy shows the `Sale` badge (`text-sale`/`border-sale`, per
  the sale-color-is-reserved rule above) regardless of stock; `soldOut`
  swaps the CTA to a disabled, muted "Sold Out" button (same footprint —
  `rounded-full`, same padding — just non-interactive styling, never a
  differently-shaped button) regardless of discount. A product can be
  either, both, or neither.
- **Add to Cart uses the same default-size rule as `TheDrop`**
  (`sizes.includes("M") ? "M" : sizes[0]`) since `ProductCard` has no size
  selector of its own, then `addItem(product, size)` + `open()` off
  `useCartStore` — identical destination as `TheDrop`, both landing in the
  same global `CartDrawer`.
- **`formatPrice()` moved to `lib/utils.ts`** during this work — it was
  independently redefined in `CartDrawer`, `TheDrop`, and the old `ShopGrid`
  stub; a fourth copy for `ProductCard` was the point past which sharing it
  made more sense than repeating it a fourth time. All three call sites now
  import the one in `lib/utils.ts`.
- **Broken images fall back to a flat placeholder, not the browser's
  broken-image icon** — `components/ui/ProductImage.tsx`, a drop-in `<img>`
  replacement (same props, `onError` swaps to a `bg-concrete` "Coming
  Soon" panel). Only `onyx-hoodie` has real photography (see "Product
  data" above); the other 5 seed products' image paths always 404, by
  design, and a page full of literal broken-image icons reads as broken
  rather than "real photography pending." Used in `ProductCard` (both
  `<img>`s) and `SceneRail`'s `RailCard` (mobile/reduced-motion modes).
  **Not used in `SceneRail`'s desktop pinned mode** — those backdrop/
  cutout `<img>`s need direct DOM refs for GSAP's parallax tweens
  (`backdropRefs`/`cutoutRefs`), and swapping to a fallback `<div>` on
  error would either need `forwardRef` support or break the ref midway;
  left as plain `<img>` there, so the desktop rail still shows a raw
  broken-image icon for the 5 placeholder products. Not used on the PDP
  (`ProductOverview`/`SpecStory`/`RelatedProducts`) either yet — same
  gap, not yet extended there.

## Global commerce UI (`components/ui/TopNav.tsx`, `CartDrawer.tsx`, `CaptureModal.tsx`)

All three are mounted once in `app/layout.tsx` (see "Homepage" above) and
persist across every route — none of them live in `app/page.tsx` or the PDP.

**TopNav** — hidden at the very top (Hero is deliberately chrome-free) and
slides in once the user has actually scrolled. Uses a *trigger-less*
`ScrollTrigger.create({ start: 80, end: "max", onEnter, onLeaveBack })` —
no `trigger` element, so `start`/`end` are plain scroll-position numbers
rather than "element crosses viewport" strings; this is the right tool
specifically because there's no single element to anchor to; a scroll
event listener would also work but this reuses the plugin already
registered globally in `lib/gsap.ts`. The show/hide transition itself is
plain CSS (`-translate-y-full`/`translate-y-0` Tailwind classes toggled by
React state) — no GSAP tween touches this element's transform, so (unlike
the Hero/SceneUnfold `yPercent` gotcha) a Tailwind transform-utility class
here is completely safe. Cart count reads `lines.reduce((n,l)=>n+l.quantity,0)`
from `useCartStore`; clicking it calls `toggle()` — the one place that
store method is actually used (everywhere else calls `open()` directly
after an add-to-cart).

**Sticky columns vs. TopNav**: introducing a fixed, appears-on-scroll nav
broke `TheDrop`'s and `ProductOverview`'s sticky image columns, which were
both originally `md:sticky md:top-0 md:h-screen` — once stuck, the nav
(fixed, higher stacking, appears past the same scroll position) would sit
on top of the first ~80px of the image permanently, not just transiently.
Both were changed to `md:sticky md:top-20 md:h-[calc(100vh-5rem)]`. Any
future sticky-positioned column should use this same offset, not `top-0`.

**CartDrawer** — rewritten this round from a CSS-transition panel to
`AnimatePresence` + `motion.aside`/`motion.div` (`x: "100%"` <-> `x: 0` for
the panel, opacity for the overlay), matching the task's explicit "slide-in
from right (framer-motion)" — the one exception to this codebase's
"GSAP owns scroll, framer-motion owns component gestures" split is that
framer-motion also owns every *global overlay's* enter/exit (this drawer,
CaptureModal, the PDP lightbox), none of which are scroll-driven.
- **Persisted to localStorage** (`lib/cart-store.ts`, zustand `persist`
  middleware, key `brand:cart`, `partialize` to just `{ lines }` —
  `isOpen`/`hasHydrated` are transient UI state, not cart contents worth
  surviving a reload).
- **`hasHydrated` isn't decorative** — it's load-bearing for correctness.
  SSR always renders the store's default `lines: []`; persist's rehydration
  from localStorage happens asynchronously after mount, so if the drawer
  rendered "Your cart is empty" immediately, a returning visitor with a
  real cart would see that flash before their lines populate. `hasHydrated`
  (flipped `true` inside `onRehydrateStorage`'s returned callback) gates a
  third body state — a `animate-pulse` skeleton — shown until rehydration
  actually completes, distinct from the real empty state.
- **MRP total / savings**: `mrpTotal = sum(priceMRP * qty)`, shown
  struck-through only when it differs from `subtotal` (i.e. `savings > 0`);
  the savings figure itself uses `text-sale`, following the same precedent
  as everywhere else sale-price gets that color — it's sale-derived, not an
  arbitrary accent, so it doesn't violate the "acid is the one accent"
  color rule.
- **Quantity stepper per line** uses the store's `setQuantity` — previously
  written but unused until this round. Decrementing to 0 calls `removeItem`
  instead of ever writing a 0-quantity line.
- **Checkout** is a real `<Link href="/checkout">`, styled as the CTA — that
  route doesn't exist yet, deliberate structure-ahead-of-content, the exact
  same precedent `/products/<id>` links were built on before the PDP shipped.

**CaptureModal** — "JOIN THE CULT" email capture, brand voice throughout
(never "subscribe"). Own tiny store, `lib/capture-modal-store.ts` (same
isOpen/open/close shape as the cart store); currently triggered from
`Footer`'s "Join the Cult" button only — wire up any future trigger (nav,
exit-intent, etc.) through that same store rather than adding local state.
- **States are `idle | loading | success | error`**, all real and
  deterministic — no backend exists, so `submitEmail()` is a `setTimeout`
  that resolves on a valid email and rejects on an invalid one. `error` is
  reached both by client-side validation (regex check before ever calling
  `submitEmail`) and by the simulated rejection — same state either way,
  so there's one error path to test, not two. Success replaces the form
  entirely with a confirmation, rather than disabling it in place.
- Reopening the modal always resets to a blank `idle` form (a `useEffect`
  keyed on `isOpen`) — a prior success/error doesn't linger behind the next
  open.

## Product Detail Page (`app/products/[id]/page.tsx`)

Server component: `generateStaticParams()` returns one entry per product
(all 6 statically prerendered), `generateMetadata()` sets a per-product
`<title>`/description, and an unmatched `id` calls `notFound()`. Next.js 15
makes route `params` a `Promise` for both — `const { id } = await params;`
in each. The page itself just resolves the product and composes four client
sections in order: `ProductOverview -> SpecStory -> ProductFAQ ->
RelatedProducts`, then `Footer` (not part of the homepage's `page.tsx`, so
PDP renders its own copy — see "Homepage" above).

**ProductOverview** (`components/sections/ProductOverview.tsx`) — sticky
gallery + purchase panel, the PDP's above-the-fold block.
- **Gallery images**: a local `galleryFor(product)` builds `[main, alt,
  ...gallery, ...(details && [fabric, print, stitch])]`, **deduped by
  `src`** — every product gets a real thumbnail rail this way
  (`gallery`/`main`/`alt` exist on all 6). The dedup specifically matters
  for `onyx-hoodie`: its `gallery` deliberately repeats `main`/`alt` ahead
  of its two real extra shots (see "Product data" above), so the naive
  concatenation would show the same two thumbnails twice without it. Every
  other seed product's `gallery` has no overlap with `main`/`alt`, so the
  dedup is a no-op for them.
- **Lightbox** is a colocated local component (tightly coupled to the
  gallery's `activeIndex` state, not reused elsewhere, so it isn't a
  `components/ui/` primitive) — fullscreen `motion.div`, Escape/←/→ keyboard
  nav, `stopPropagation` on the image and prev/next controls so only
  clicking the backdrop closes it.
- **Purchase panel copy order**: colorway (eyebrow) -> name (`h1` — this is
  the page's real heading, unlike `TheDrop`'s `h2`) -> `moodLine` -> `hook`
  -> `useCase` -> price block -> size chips -> quantity stepper -> Add to
  Cart -> "Ships within 24–48h". Size-chip/price-block styling is copied
  verbatim from `TheDrop` for visual consistency across the site.
- **Quantity** is local state (`useState(1)`, capped at 10), passed as
  `addItem(product, size, quantity)` — the store's `addItem` already took
  an optional `quantity` param (written for this, unused until now).
  `soldOut` disables the whole size/qty/CTA block (`opacity-50` +
  `disabled` on every control), not just the button — same disabled
  footprint precedent as `ProductCard`'s Sold Out state.

**SpecStory** (`components/sections/SpecStory.tsx`) — "spec as story": the
three `product.specs` entries (`fabric`/`cut`/`print`) as full-width
chapters, alternating image/text side via `md:order-1`/`md:order-2` (not a
`direction: rtl` trick) and alternating `bg-bg`/`bg-bg-raised` per chapter
using existing tokens — no new colors, the "themed" differentiation is
structural, not palette-based. Reveal is the exact same one-shot mask-wipe
`ScrollTrigger` pattern as `TheDrop`'s detail panels (`clipPath: inset(0%
0% 100% 0%) -> inset(0%)`, `once: true`, `top 80%`), just full-width per
chapter instead of stacked in a side column. There's no dedicated "cut"
image field — `chapterImage()` falls back through `gallery` ->
`main`/`alt` so every chapter is populated for every product, same
fallback spirit as `ProductOverview`'s `galleryFor()`.

**ProductFAQ** (`components/sections/ProductFAQ.tsx`) — fit / wash care /
sizing / drop timing, answers computed from the product's own
`specs`/`sizes`/`soldOut` (a `faqFor(product)` function) rather than static
boilerplate, so "product-specific" is actually true — no new data fields
needed, everything it reads already exists on `Product`. Expand/collapse
is the CSS `grid-template-rows: 0fr -> 1fr` trick (a `grid` wrapper
animating `grid-template-rows` via `transition-[grid-template-rows]`,
inner `overflow-hidden` child) — no JS height measurement, no GSAP/framer,
deliberately the lightest-weight animation technique in the codebase,
matching the top-of-file mandate that PDP/cart stay fast and WebGL/GSAP-
pin-free. (Framer-motion wasn't reached for either — this isn't a gesture
or an overlay, it's a scroll-independent height transition, outside both
established framer-motion and GSAP use cases here.)

**RelatedProducts** (`components/sections/RelatedProducts.tsx`) — "You May
Also Like", a plain **server** component (no `"use client"`, no scroll
reveal of its own) — `ProductCard` already carries its own client
interactivity, and PDP's fast/clean mandate is better served by shipping
zero extra client JS for this section than by adding a staggered entrance.
`relatedTo()` sorts same-category before other products, caps at 4. No
dedicated category field — `categoryOf()` checks whether `"hoodie"` appears
*anywhere* in the id, not a prefix split (`id.split("-")[0]`): `onyx-hoodie`
doesn't start with `"hoodie-"`, so a prefix check would've put it in a
category of its own, matching nothing. Rendered as a plain native
`overflow-x-auto snap-x` rail, not a pinned/carousel one — no scroll-
jacking on PDP, same rule `SceneRail`'s mobile mode already follows.

**Gotcha — this environment's rAF throttling delays CSS transitions too,
not just GSAP/rAF-driven JS.** While testing `ProductFAQ`'s grid-rows
transition and `CartDrawer`/`CaptureModal`'s framer-motion exit animations
live in this browser-automation tab, `getComputedStyle()` continued
reporting the *pre*-transition value (e.g. `grid-template-rows: 0px`, a
still-mounted "closed" dialog) for 1–3+ seconds after the state change and
click had already landed correctly (confirmed via the *inline* style,
which reflected the new value immediately — only the computed/rendered
value lagged). This is the same `document.hidden`/no-real-focus root cause
documented under "Manifesto" and "Hero WebGL" above, just showing up as
delayed layout/paint instead of a dead observer or a lost GPU context. If
a transition or exit animation looks "stuck" mid-test here, wait longer
and recheck the *inline* style (the JS-side source of truth) before
assuming the code is wrong.

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
