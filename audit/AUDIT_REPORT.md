# BRAND — Visual + Structural Audit (post Cursor + Lookbook)

Report reflects the site after: DROP 01 asset wiring, Clash Display self-hosting,
SceneRail backdrop-gradient rewrite, TheDrop→VENOM, ShopGrid bento rebuild, Footer
4-column rebuild, the global custom cursor, and the new Lookbook band. Captured
against the live dev server with Playwright + Chromium (`audit/capture.mjs`).

**Note on screenshots**: the small circular "N" badge bottom-left is the Next.js
dev-mode indicator — only appears under `next dev`, not in production.

---

## Section-by-section

| # | Section | Grade | Note |
|---|---|---|---|
| 1 | Loader | ✓ renders & styled | Confirmed via `sessionStorage` flag (`played:true`). |
| 2 | WebGL Hero | ⚠ WebGL blank in headless | `hasCanvas:false`, `hasFallbackImg:true` — SwiftShader/headless falls back to the `<img>`, exactly as designed (see `Hero.tsx`'s context-loss handling). Still unverified in a real GPU browser — ask still stands from the last audit. |
| 3 | Scene 1 (pinned frame sequence) | ✓ renders & styled | `found:true`, `hasCanvas:true`, no stuck loading stub. 96/96 real frames still resolve 200. |
| 4 | Scene 2 (horizontal rail) | ✓ renders & styled | 4 Explore links, WebGL transition overlay present. Backdrop is now a generated gradient (no more 404s). |
| 5 | **Lookbook** (new) | ✓ renders & styled | `found:true`, all 3 slide headlines present (`HEAVY`, `BONE`, `VENOM`). Desktop pin + kinetic-type parallax + clip-path reveal confirmed visually; mobile Embla swipe confirmed working; reduced-motion snap-row fallback confirmed working. |
| 6 | Manifesto | ✓ renders & styled | Both lines, marquee, and video all present. |
| 7 | The Drop | ✓ renders & styled, featuring VENOM | `featuredName:"VENOM"` (fixed from ONYX). Detail panels present (Cuff/Flatlay), currently `main.jpg` fallbacks — TODO already tracked. |
| 8 | Shop Grid | ✓ renders & styled, real bento | `hasIndexNumbers:true`, `cardHeights:[352,728]` — two distinct heights confirms the asymmetric grid (VENOM's tall cell vs. everyone else), not a uniform grid anymore. |
| 9 | Footer | ✓ renders & styled, real 4-column | `topLevelChildCount:3` (the 3 link columns + the Contact column, which isn't a `FooterColumn` instance), `hasPolicyLinks:5`, `hasWhatsApp:true`. |

**Global elements**

| Element | Status | Note |
|---|---|---|
| Custom cursor | ✓ mounted & works | `cursorCandidate:true` (the `cursor-none` class is active on `<html>`). Verified: lerped dot at rest, scales up with "VIEW"/"DRAG"/"ADD" labels over the right zones, `mix-blend-mode: difference` confirmed visually against both light and dark backgrounds. Correctly inactive under `prefers-reduced-motion` and on touch (both verified). |
| Cart drawer | ✓ mounted & works | Only present in the DOM while open (framer-motion unmounts it closed) — confirmed via the live Add to Cart interaction test. |
| Capture modal | ✓ mounted & works | Same as above; confirmed via the live "Join the Cult" interaction test. |
| Sticky nav (TopNav) | ✓ mounted & works | `topNavFound:true`, visible after scroll. |

**Route: `/products/[id]`**

✓ Both tested PDPs return 200, fully built (unchanged from last audit).

---

## Diagnostics

- **Console messages: 5**, all the same benign headless-WebGL fallback warnings from every prior audit (shader source dumps + one GPU-stall + one context-lost, all from Hero's canvas failing to acquire WebGL under SwiftShader). Zero real errors.
- **Page errors: 0** on the standard (non-reduced-motion) desktop/mobile/PDP passes.
- **HTTP 4xx/5xx: 0.**
- **Sequence frames: 192/192** (96 × 2 visits) resolved 200.
- **Failed requests: 13**, all `net::ERR_ABORTED` — a Next.js RSC prefetch and one Manifesto video load, both cut off by the audit script navigating to the next test mid-flight. Not real failures (confirmed 0 actual 4xx/5xx).

## Known issues (not fixed this round, flagged for follow-up)

1. **Stacked-pin dead-scroll gap** — the pre-existing SceneRail issue (documented two audits ago: a `ScrollTrigger`'s start/end gets measured before an earlier section's own async-gated pin exists) now also produces a second, smaller dead-scroll gap after Lookbook's slides, for the identical root cause — Lookbook is a third pin stacked after SceneUnfold and SceneRail. Bounded (~300-900px each), content recovers correctly afterward, doesn't affect mobile or reduced-motion (neither pins). Six different fixes were tried against the SceneRail instance previously and none worked — this needs a structural fix to pin-creation ordering across sections, not a value-level change.
2. **Manifesto video hydration mismatch under `prefers-reduced-motion`** — found while testing Lookbook's reduced-motion path, unrelated to it. `framer-motion`'s `useReducedMotion()` can't know the real value during SSR, so the server always renders Manifesto's `<video>`; if the client's real setting is "reduce," React detects a mismatch and regenerates that part of the tree. Not a hard crash, but a real, fixable bug — worth a dedicated pass.
3. **Footer's "Lookbook" link is now stale** — it points at the standalone `/lookbook` "still being shot" holding page, but the real homepage Lookbook band exists now. Worth pointing it at an anchor on the homepage band instead, or updating the holding page's copy.

## Which screenshots to open first

1. `desktop_0000vh.png` — Hero with the glitch effect + real Clash Display type.
2. `desktop_1000vh.png` — Lookbook mid-transition (BONE → VENOM), kinetic type sweep clearly visible.
3. `desktop_1700vh.png` — Shop Grid's bento layout + the real 4-column Footer, both in one frame.
4. `card_hover.png`, `cart_drawer.png`, `modal.png` — confirm the custom cursor doesn't interfere with any existing interaction (all still work).
