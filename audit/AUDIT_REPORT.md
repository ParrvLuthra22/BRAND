# BRAND — Visual + Structural Audit

Report-only. No component or asset was modified to produce this. Captured against
the live dev server (`npm run dev`, port 3000) with Playwright + Chromium
(`--use-gl=angle --use-angle=swiftshader --enable-webgl`), desktop 1440×900 and
mobile 390×844 (iPhone-sized), plus two PDP routes. Script: `audit/capture.mjs`.
Raw machine-readable output: `audit/raw-findings.json`. 33 screenshots in
`audit/screenshots/`.

**Note on git state at capture time**: `data/products.ts` and the three new
`bone-hoodie`/`venom-hoodie`/`mono-tee` asset folders were uncommitted, in-progress
work (mid-session before this audit was requested) — the dev server picked them up
live, so this audit reflects that current working-tree state, not just the last
commit.

**Note on screenshots**: a small circular "N" badge visible bottom-left in every
shot is the Next.js dev-mode indicator. It only appears under `next dev` and will
not exist in a production build — not a site bug.

---

## 1. Section-by-section grade

| # | Section | Grade | Note |
|---|---|---|---|
| 1 | Loader | ✓ renders & styled | RGB-split glitch wordmark + real `%` counter, wipes to reveal. Confirmed via code + `sessionStorage` flag flip (`brand:loader-played`). Could not catch it mid-animation in headless — local assets load fast enough that it completed before the first screenshot in both runs. See `desktop_loader.png` / `mobile_loader.png` (both post-completion). |
| 2 | WebGL Hero | ⚠ renders but WebGL fell back | Wordmark, eyebrow, moodline, scroll cue all present and styled (`desktop_0000vh.png`). **WebGL canvas did not render** — console shows `CONTEXT_LOST_WEBGL` + a GPU stall, and the DOM audit confirms `hasCanvas:false` / `hasFallbackImg:true`. This is the documented "no WebGL → fall back to `<img>`" path in `Hero.tsx` firing correctly, not a crash — flagging as **"WebGL blank in headless (SwiftShader), may render in a real GPU browser"** per your instruction, not as broken. The static fallback photo itself looks correct and full-bleed. |
| 3 | Scene 1 (pinned frame sequence) | ✓ renders & styled | Pin + scrub confirmed (`sceneUnfold.found/hasCanvas: true`, no stuck "Loading" stub). Visually sharp, well-composed cropped frames mid-scrub (`desktop_0200vh.png`). All 96 real sequence frames resolved 200 (see §4). One thing to know, not a bug: Scene 1 has no mobile-specific branching — it still runs the full pin/scrub on a 390px viewport (unlike Scene 2, which has a dedicated non-scroll-jacking mobile mode). `mobile_0300vh.png` catches it mid-reveal with only a thin sliver of the frame visible — that's the mask-wipe's correct partial-open state (`clipPath` revealing top-down), not a glitch, just an unflattering moment to freeze mid-scrub. |
| 4 | Scene 2 (horizontal rail) | ✓ renders & styled | `exploreLinkCount: 4`, canvas overlay present. Desktop pin + parallax confirmed visually across `desktop_0400vh–0800vh.png` (product swap mid-transition, moodlines, acid-bordered EXPLORE pill). Mobile correctly uses the **non-scroll-jacking** Embla carousel — confirmed both in code and visually (`mobile_0300vh.png` shows the next card peeking in from the right edge, swipeable, not pinned). No horizontal page overflow was ever detected on mobile (see §6). |
| 5 | Lookbook | ✗ missing | No `Lookbook.tsx` file exists in `components/sections/`, nothing in the DOM matches. Not built yet — expected, this is Tier 2 / Job A scope that hasn't started. |
| 6 | Manifesto | ✓ renders & styled | Both statement lines, marquee, and the ambient background video all confirmed live in DOM and visually (`desktop_0900vh.png`, `mobile_0400vh.png` — fabric motion + "TAKE UP SPACE —" marquee clearly visible, dim and grainy as designed). |
| 7 | The Drop (featured product) | ⚠ renders but wrong product | Fully built and well-styled — sticky image, price block, size selector, Add to Cart, two real mask-wipe detail shots (Cuff, Flatlay) both confirmed rendering cleanly (`desktop_1000vh–1200vh.png`). **`FEATURED` is still hardcoded to `onyx-hoodie`**, not `venom-hoodie` — `TheDrop.tsx:9`. This is a known-pending item from your Job B spec ("make VENOM the featured product"), not yet applied. |
| 8 | Shop Grid | ⚠ renders but not the asymmetric bento spec | All 4 products render correctly (`ONYX`/`BONE`/`VENOM`/`MONO`), correct sale pricing, Sale badges, Add to Cart (`desktop_1300vh.png`, `desktop_1400vh.png`). It is currently a **plain uniform `grid-cols-2/3/4`** — every card the same `aspect-[3/4]` box (DOM audit: `cardHeights: [614]`, a single value = zero size variation). **No asymmetric/bento layout, no half-cropped 01–04 index numbers** (`hasIndexNumbers: false`). This is Job A scope, not started. |
| 9 | Footer | ✗ far short of spec | Renders and is styled, but it's minimal: wordmark + "Join the Cult" pill + one copyright line (`desktop_1400vh.png`). **No 4-column layout, no policy links (privacy/terms/shipping/returns), no WhatsApp** — `hasPolicyLinks: 0`, `hasWhatsApp: false`. This is the single largest gap against your spec list — currently a stub, not the real footer. |

**Global elements**

| Element | Status | Note |
|---|---|---|
| Custom cursor | ✗ missing | No `Cursor.tsx` exists, no cursor-like element in the DOM. Job A scope, not started. |
| Cart drawer | ✓ mounted & works | `CartDrawer` is mounted globally in `layout.tsx`. Confirmed live end-to-end: Add to Cart → drawer slides in from right with correct line item, MRP/subtotal/savings math, Checkout link (`cart_drawer.png`). It only exists in the DOM while open (framer-motion `AnimatePresence` unmounts on close) — the DOM audit's `cartDrawerMounted:false` at rest is expected, not a bug. |
| Capture modal | ✓ mounted & works | Same pattern as the cart drawer. Triggered from Footer's "Join the Cult" button, confirmed live (`modal.png`) — centered panel, email field, validation copy all present. |
| Sticky nav (TopNav) | ✓ mounted & works | Confirmed in DOM (`topNavFound:true`); correctly hidden at scroll 0 (deliberate — Hero is chrome-free) and confirmed sliding in once scrolled, visible with live cart count in every mid-scroll screenshot from Scene 2 onward. |

**Route: `/products/[id]`**

✓ Both PDPs tested return **HTTP 200** and are fully built: sticky gallery + purchase
panel (size chips, qty stepper, Add to Cart, "Ships within 24–48h"), full
`SpecStory` (Fabric/Cut/Print as alternating full-width chapters), `ProductFAQ`
accordion (4 questions), `RelatedProducts` rail. See `pdp_venom.png` /
`pdp_onyx.png` — both look complete and on-brand. One content gap visible on the
Venom PDP: the gallery only offers 2 thumbnails, both the same shot — `alt`/`cutout`
are still falling back to `main` per the known asset gap (see below).

---

## 2. Known content gaps (from `data/products.ts`, confirmed live)

Not console errors, but worth flagging distinctly since they change what's *visually*
on the page even though nothing 404s:

- `venom-hoodie` and `mono-tee`: `images.alt` and `images.cutout` both currently
  fall back to `images.main` (same file, no 404 — it exists). Consequence: Scene 2's
  "floating cutout" treatment for these two products shows the full rectangular
  studio photo instead of an isolated garment (visible in `desktop_0600vh.png` —
  the Venom hoodie renders as a framed photo, not a silhouette). Product cards'
  hover-swap will also show the same image twice for these two.
- All 4 products: `images.backdrop` doesn't exist yet (4 confirmed 404s, one per
  product) — Scene 2's backdrop plate behind each cutout is currently empty/black.

---

## 3. Fonts

- **Space Grotesk**: loads correctly — `document.fonts.check('400 1em "Space Grotesk"')` → `true`.
- **Space Mono**: loads correctly (`Space Mono 400 [loaded]` in the face list).
- **Clash Display**: **not loading** — both requested weights (`Regular`, `Semibold`) 404 (`status: [error]` in the face list, `document.fonts.check('600 1em "Clash Display"')` → `false`). Matches CLAUDE.md: the woff2 files were never committed. Every headline/wordmark on the site is silently rendering in the system sans-serif fallback right now, not Clash Display — worth knowing since it changes how "done" the typography looks in every screenshot in this report.

---

## 4. Scene 1 — sequence frame loading

All **96/96** real frames (`SEQUENCE_FRAME_COUNT`) resolved with **HTTP 200** on
every homepage visit — sampled 192 total requests across the desktop + mobile runs
(96 × 2 visits), zero 404s among them. The sequence is fully wired and loading
correctly.

---

## 5. Console errors / warnings (deduped)

**29 console messages total, 0 uncaught page errors (`pageerror`) anywhere** —
no unhandled JS exceptions on the homepage (desktop or mobile) or either PDP. That's
the strongest signal here: nothing is actually crashing.

Breakdown:
- **24× "Failed to load resource: 404"** — one line per failed request, see §6 for
  the deduped URL list. Roughly half of these are doubled because Next.js dev mode
  runs React Strict Mode, which intentionally double-invokes effects (mount →
  cleanup → mount) in development only — e.g. the 4 backdrop 404s appear twice in a
  row on first load. This won't happen in a production build; the underlying unique
  missing files are listed once each in §6.
- **5× WebGL warnings** on desktop-home only — 2 shader-source dumps, 1 GPU stall
  ("GPU stall due to ReadPixels"), 1 `CONTEXT_LOST_WEBGL`. All tied to `HeroCanvas`
  failing to get a working WebGL context under SwiftShader software rendering and
  falling back to the `<img>`, exactly the path `Hero.tsx` already handles (see
  CLAUDE.md's "Context loss" note). Expected in this headless environment, not
  evidence of a real bug — flagged, not fixed, per your report-only instruction.

---

## 6. Failed network requests / 404s (deduped by URL)

| URL | Cause |
|---|---|
| `/media/images/products/onyx-hoodie/backdrop.jpg` | Not generated yet (commented `// TODO` in `data/products.ts`) |
| `/media/images/products/bone-hoodie/backdrop.jpg` | Same |
| `/media/images/products/venom-hoodie/backdrop.jpg` | Same |
| `/media/images/products/mono-tee/backdrop.jpg` | Same |
| `/fonts/ClashDisplay-Regular.woff2` | Font file never committed (CLAUDE.md, "Fonts") |
| `/fonts/ClashDisplay-Semibold.woff2` | Same |

That's it — **6 unique missing assets**, all already known/documented gaps. No
unexpected 404s, no 500s, anywhere across desktop, mobile, or either PDP.

---

## 7. Stubs / placeholder content

- **Footer** is a functional stub relative to spec (§1, item 9) — real content
  (wordmark, CTA, copyright) but far short of "4 columns, policy links, WhatsApp."
- No lorem ipsum or scaffold placeholder text found anywhere — every product's
  copy (`hook`, `useCase`, `description`, `specs`) is real, hand-written brand copy.
- `Lookbook` and the custom `Cursor` are simply absent (not stubbed, not started).

---

## Terminal summary

```
Console errors/warnings: 29  (24 are 404 echoes, 5 are headless-WebGL fallback noise)
Uncaught page errors:     0
Unique 404s:               6  (4× product backdrop.jpg, 2× Clash Display woff2 — all known/documented gaps)
Sequence frames resolved: 96 / 96 (100%)

Sections:
 1. Loader                 ✓ renders & styled (verified via code + sessionStorage flag)
 2. WebGL Hero              ⚠ WebGL blank in headless (SwiftShader) → correct <img> fallback rendered
 3. Scene 1 (frame seq)     ✓ renders & styled, 96/96 frames load
 4. Scene 2 (rail)          ✓ renders & styled, no mobile scroll-jack
 5. Lookbook                ✗ not built
 6. Manifesto                ✓ renders & styled
 7. The Drop                ⚠ renders & styled, but featured = ONYX, spec says VENOM
 8. Shop Grid                ⚠ renders & styled, but plain grid — no bento/index numbers
 9. Footer                   ✗ stub — missing 4-col layout, policy links, WhatsApp
 Global: cursor ✗ / cart drawer ✓ / capture modal ✓ / sticky nav ✓
 PDP route: ✓ both tested products return 200, fully built
```

## Which screenshots to open first

1. `desktop_1400vh.png` — Shop Grid + Footer together; clearest single shot of the
   two biggest gaps (uniform grid vs. bento, and the thin footer).
2. `desktop_1000vh.png` — The Drop, to see the ONYX-not-VENOM mismatch directly.
3. `desktop_0600vh.png` — Scene 2 mid-transition; shows the Venom "cutout" rendering
   as a full framed photo instead of a floating silhouette (the `alt`/`cutout`
   fallback gap from §2).
4. `desktop_0000vh.png` — Hero as it actually ships right now (WebGL fallback img,
   not the shader canvas).
5. `cart_drawer.png` / `modal.png` / `card_hover.png` — the three interaction states
   that are fully working, for contrast against the gaps above.
6. `pdp_venom.png` — full PDP, to see how complete that route already is relative to
   the homepage gaps.
