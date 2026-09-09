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
`text-caption`, `text-mono`. Line-height (and, for `display`, `-0.03em`
letter-spacing) is baked into each token via Tailwind v4's
`--text-{name}--line-height` / `--text-{name}--letter-spacing` sibling
convention — you don't need to set line-height manually when using these.

```
hero     clamp(4rem, 18vw, 20rem)
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
components/webgl/       ogl/WebGL shader + image-sequence components
                        (empty scaffold so far — SceneUnfold/SceneRail
                        will mount real canvases from here)
lib/gsap.ts             shared gsap + ScrollTrigger export (registers the plugin once)
lib/lenis.tsx           LenisProvider + useLenis()
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
`Loader → Hero → SceneUnfold → SceneRail → Manifesto → TheDrop → ShopGrid → Footer`

All eight are currently bare placeholder stubs in `components/sections/`
(brand tokens applied, no real animation/WebGL/data-fetching logic yet).
`SceneUnfold` and `SceneRail` are where the two scroll-driven WebGL scenes
get built — they're the only homepage sections allowed to reach into
`components/webgl`.

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
