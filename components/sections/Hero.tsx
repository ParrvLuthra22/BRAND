"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, EASE_OUT } from "@/lib/gsap";
import { useLenis } from "@/lib/lenis";
import { LOADER_COMPLETE_EVENT, hasLoaderPlayed, HERO_IMAGE_SRC } from "@/lib/loader";
import { HeroCanvas } from "@/components/webgl/HeroCanvas";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Coarse pointer + narrow viewport together are a decent proxy for "actual
// phone" without also catching wide touch-laptops — those can still afford
// the WebGL pass.
function isMobileLite(): boolean {
  return (
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(max-width: 767px)").matches
  );
}

// Same inset(top% 0% bottom% 0%) shape as Loader.tsx's randomGlitchBand(),
// duplicated rather than shared — Loader's is tuned for a small text glyph,
// this one's tuned for a full-bleed photo (wider bands read better at that
// scale).
function randomGlitchBand() {
  const top = gsap.utils.random(0, 80);
  const height = gsap.utils.random(6, 22);
  const bottom = Math.max(0, 100 - top - height);
  return `inset(${top}% 0% ${bottom}% 0%)`;
}

const GLITCH_SLICE_COUNT = 4;
const GLITCH_STREAK_COUNT = 3;
const STREAK_COLORS = ["#00ff9d", "#00c8ff", "#ff2ec4"];

/**
 * Periodic glitch burst over the hero photo: real per-channel RGB splitting
 * (an SVG filter — feColorMatrix isolates R/G/B, feOffset shifts R and B in
 * opposite directions, feBlend screens them back together — CSS alone can't
 * isolate true colour channels, only an SVG filter can), animated by
 * tweening the feOffset primitives' dx/dy attributes directly via GSAP's
 * `attr` tween (the same mechanism HeroCanvas uses to tween GLSL uniforms —
 * "GSAP can tween any plain object property," here that's an SVG attribute
 * instead of a uniform). Layered with torn/displaced horizontal slices and
 * a few colour-streak flashes for the "corrupted broadcast" look, all
 * clipped to the photo's own box (`absolute inset-0` inside Hero's section,
 * same box the img/canvas renders into).
 *
 * Cycles rest -> burst -> rest: a several-hundred-ms burst of rapid stutter
 * frames every few seconds, snapping back to the clean, sharp photo between
 * bursts. Constant distortion would fight the "read the photo" job Hero's
 * image has to do; a burst that resolves back to normal reads as a designed
 * flourish instead. `src` reuses the exact URL already loaded for the photo/
 * canvas texture, so this hits the browser cache, not the network.
 */
function HeroGlitch({ src }: { src: string }) {
  const redOffsetRef = useRef<SVGFEOffsetElement>(null);
  const blueOffsetRef = useRef<SVGFEOffsetElement>(null);
  const rgbLayerRef = useRef<HTMLDivElement>(null);
  const sliceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const streakRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let timeoutId: number;

    function reset() {
      gsap.set(redOffsetRef.current, { attr: { dx: 0, dy: 0 } });
      gsap.set(blueOffsetRef.current, { attr: { dx: 0, dy: 0 } });
      gsap.set(rgbLayerRef.current, { autoAlpha: 0 });
      gsap.set(sliceRefs.current, { autoAlpha: 0, x: 0 });
      gsap.set(streakRefs.current, { autoAlpha: 0, scaleX: 0 });
    }

    function burst() {
      const tl = gsap.timeline({
        onComplete: () => {
          reset();
          timeoutId = window.setTimeout(burst, gsap.utils.random(700, 1600));
        },
      });
      const stutters = Math.round(gsap.utils.random(12, 18));

      for (let i = 0; i < stutters; i++) {
        tl.set(rgbLayerRef.current, { autoAlpha: gsap.utils.random(0.75, 1) })
          .set(
            redOffsetRef.current,
            { attr: { dx: gsap.utils.random(-36, 36), dy: gsap.utils.random(-8, 8) } },
            "<"
          )
          .set(
            blueOffsetRef.current,
            { attr: { dx: gsap.utils.random(-36, 36), dy: gsap.utils.random(-8, 8) } },
            "<"
          )
          .set(
            sliceRefs.current,
            {
              autoAlpha: () => (gsap.utils.random(0, 1) > 0.25 ? 1 : 0),
              x: () => gsap.utils.random(-40, 40),
              clipPath: () => randomGlitchBand(),
            },
            "<"
          )
          .set(
            streakRefs.current,
            {
              autoAlpha: () => (gsap.utils.random(0, 1) > 0.4 ? 0.9 : 0),
              top: () => `${gsap.utils.random(5, 90)}%`,
              scaleX: 1,
            },
            "<"
          )
          .to({}, { duration: gsap.utils.random(0.1, 0.19) });
      }
    }

    timeoutId = window.setTimeout(burst, gsap.utils.random(300, 700));

    // Captured now (not read fresh in the cleanup below) — refs may already
    // point elsewhere by unmount time, but the tweens targeting *these*
    // specific nodes are exactly what needs killing.
    const targets = [
      redOffsetRef.current,
      blueOffsetRef.current,
      rgbLayerRef.current,
      ...sliceRefs.current,
      ...streakRefs.current,
    ];
    return () => {
      window.clearTimeout(timeoutId);
      gsap.killTweensOf(targets);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* width/height 0 + absolute: the filter still applies wherever it's
          referenced by url(#hero-rgb-split), this just keeps the <svg>
          itself from taking up any layout space. */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="hero-rgb-split" x="-20%" y="-20%" width="140%" height="140%">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red"
            />
            <feOffset ref={redOffsetRef} in="red" dx="0" dy="0" result="redOffset" />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="green"
            />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="blue"
            />
            <feOffset ref={blueOffsetRef} in="blue" dx="0" dy="0" result="blueOffset" />
            <feBlend in="redOffset" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blueOffset" mode="screen" />
          </filter>
        </defs>
      </svg>

      {/* The real RGB-split layer — a duplicate of the photo with the SVG
          filter above applied, opacity/filter-offsets driven by the burst
          timeline. Sepia+saturate first pushes the source toward a single
          hue so the isolated channels read as distinct colours rather than
          the source photo's own (mostly desaturated black/grey) palette. */}
      <div
        ref={rgbLayerRef}
        className="absolute inset-0 opacity-0"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "100% auto",
          backgroundPosition: "top",
          filter: "url(#hero-rgb-split) saturate(3) contrast(1.3) brightness(1.15)",
        }}
      />

      {/* Torn/displaced horizontal slices — same filtered duplicate, cropped
          to a random band and jittered a few tens of px each stutter frame. */}
      {Array.from({ length: GLITCH_SLICE_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            sliceRefs.current[i] = el;
          }}
          className="absolute inset-0 opacity-0"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "100% auto",
            backgroundPosition: "top",
            filter: "url(#hero-rgb-split) saturate(3) contrast(1.3) brightness(1.15)",
          }}
        />
      ))}

      {/* Thin colour-streak flashes — the "light trail" accents. */}
      {Array.from({ length: GLITCH_STREAK_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            streakRefs.current[i] = el;
          }}
          className="absolute inset-x-0 h-px opacity-0"
          style={{
            top: "50%",
            background: `linear-gradient(90deg, transparent, ${STREAK_COLORS[i % STREAK_COLORS.length]}, transparent)`,
            mixBlendMode: "screen",
            transformOrigin: "center",
          }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // SSR-safe default (matches first client render too, avoiding a hydration
  // mismatch) — upgraded to WebGL pre-paint in the useLayoutEffect below.
  const [useWebGL, setUseWebGL] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const rootRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const wordmarkRef = useRef<HTMLHeadingElement>(null);
  const moodRef = useRef<HTMLParagraphElement>(null);
  const scrollCueRef = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  const lenis = useLenis();

  // Stable identity: HeroCanvas's setup effect depends on [src, onError], so
  // a fresh inline arrow here would tear down and rebuild the whole WebGL
  // pipeline on every unrelated Hero re-render (ready, scrolled, ...).
  const handleWebGLError = useCallback(() => setUseWebGL(false), []);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setPrefersReducedMotion(prefersReduced);
    setUseWebGL(!prefersReduced && !isMobileLite() && supportsWebGL());

    // GSAP must own this element's transform from the start. A CSS class
    // (e.g. Tailwind's `translate-y-full`) would pre-seed the computed
    // `transform` via the standalone `translate` property; GSAP's yPercent
    // parser then caches that as a frozen pixel `y` baseline and never
    // reconciles it with the animated yPercent, so the tween silently never
    // paints. Setting it here means there's never a competing CSS value —
    // the loader overlay is still covering the page at this point anyway.
    gsap.set(wordmarkRef.current, { yPercent: 100 });
  }, []);

  useEffect(() => {
    function start() {
      if (startedRef.current) return;
      startedRef.current = true;
      setReady(true);
    }

    // Loader already gated the site earlier this session (e.g. a client-side
    // route change) — its "complete" event already fired and is gone, so
    // start immediately instead of waiting for an event that won't repeat.
    if (hasLoaderPlayed()) {
      start();
      return;
    }

    window.addEventListener(LOADER_COMPLETE_EVENT, start);
    return () => window.removeEventListener(LOADER_COMPLETE_EVENT, start);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      gsap.set([eyebrowRef.current, moodRef.current, scrollCueRef.current], {
        autoAlpha: 1,
        y: 0,
      });
      gsap.set(wordmarkRef.current, { yPercent: 0 });
      return;
    }

    const tl = gsap.timeline();
    tl.fromTo(
      eyebrowRef.current,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE_OUT }
    )
      .to(wordmarkRef.current, { yPercent: 0, duration: 1.2, ease: EASE_OUT }, "-=0.4")
      .fromTo(
        [moodRef.current, scrollCueRef.current],
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE_OUT, stagger: 0.1 },
        "-=0.6"
      );

    return () => {
      tl.kill();
    };
  }, [ready]);

  // "SCROLL ↓" fades on first scroll — one-way, via the same GSAP-driven
  // opacity so it never fights the intro timeline's inline styles.
  useEffect(() => {
    if (!lenis || scrolled) return;
    const unsubscribe = lenis.on("scroll", ({ scroll }) => {
      if (scroll > 10) setScrolled(true);
    });
    return unsubscribe;
  }, [lenis, scrolled]);

  useEffect(() => {
    if (!ready || !scrollCueRef.current) return;
    gsap.to(scrollCueRef.current, {
      autoAlpha: scrolled ? 0 : 1,
      duration: 0.6,
      ease: EASE_OUT,
      overwrite: true,
    });
  }, [ready, scrolled]);

  return (
    <section ref={rootRef} className="relative isolate w-full overflow-hidden bg-bg">
      {/* Full photo at its own natural aspect ratio, filling the viewport
          width — NOT object-fit at all, on request: the whole standing
          figure should be full-size, not shrunk to fit inside one screen.
          hero.jpg is a tall portrait (941x1672), so at full width this
          section runs to roughly 1.78x the viewport width in height —
          around 2-3 screens of normal scroll depending on the viewport,
          not a pinned/scroll-jacked reveal, just a tall image in normal
          flow. The overlay content below is a separate absolutely-
          positioned layer pinned to exactly the first screen, so hero copy
          reads as "over the top of a tall photo," not stretched across
          the whole scroll span. */}
      {useWebGL ? (
        <HeroCanvas
          src={HERO_IMAGE_SRC}
          // aspect-[941/1672] (hero.jpg's real dimensions), not h-full off
          // an -z-10 absolute box: this container is a normal-flow element
          // now, and its own canvas child is height:100% internally (see
          // HeroCanvas.tsx) — it needs a real, non-circular height to
          // resolve against, which only an explicit aspect-ratio (or a
          // hardcoded height) can give it here. No position/z-index — it's
          // the first, plain-static child, which is already enough to sit
          // behind the tint + overlay below (both position:absolute) per
          // normal paint order. A negative z-index here was tried and
          // actively broke this: on a position:relative element it creates
          // its own stacking context, which — without the section's own
          // `isolate` (added for exactly this) — could resolve against an
          // ancestor far above Hero and render behind unrelated content.
          className="block aspect-[941/1672] w-full"
          onError={handleWebGLError}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={HERO_IMAGE_SRC}
          alt=""
          aria-hidden
          width={941}
          height={1672}
          className="block h-auto w-full"
        />
      )}

      {/* No z-index on either of these — the image above is a plain static
          element now (see its own comment), so DOM order alone already
          puts these two (both position:absolute) on top of it, correctly.
          A negative z-index here specifically would do the opposite of
          what it looks like it does: negative-z positioned descendants
          paint *before* normal static content, so it'd end up behind the
          image instead of tinting it. */}
      <div aria-hidden className="absolute inset-0 bg-bg/25" />

      {/* Periodic glitch flourish — skipped entirely under reduced motion,
          same as every other animated layer in this section. Sits after the
          tint and before the text overlay in DOM order (Hero's established
          convention: plain DOM order + no z-index, see the notes above) so
          it never washes out the copy on top. */}
      {!prefersReducedMotion && <HeroGlitch src={HERO_IMAGE_SRC} />}

      <div className="absolute inset-x-0 top-0 flex h-screen flex-col px-6 py-10 md:px-10">
        {/* Grouped at the top, not vertically centered — hero.jpg's subject
            is centered with their head starting ~22% down the *image's*
            full height. At full-width sizing that's comfortably within the
            first screen for any realistic viewport (a wider viewport makes
            the whole image taller too, so the head's pixel position only
            ever grows, never shrinks below the screen). The wordmark's
            size is a bespoke vh-based clamp rather than the --text-hero
            token — text-hero's 18vw-driven max (20rem) would still overflow
            a reasonable headroom budget on normal desktop widths; sizing
            off vh keeps it well inside the space above the head. */}
        <div className="flex flex-col gap-2">
          <span ref={eyebrowRef} className="mono-label text-muted opacity-0">
            Brand / SS26
          </span>

          <div className="overflow-hidden">
            <h1
              ref={wordmarkRef}
              className="text-[clamp(2.5rem,9vh,7rem)] font-display uppercase leading-none tracking-[-0.03em] text-paper"
            >
              Brand
            </h1>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <p ref={moodRef} className="mono-label text-acid opacity-0">
            Heavy. Cropped. Relentless.
          </p>
          <span ref={scrollCueRef} className="mono-label text-muted opacity-0">
            Scroll ↓
          </span>
        </div>
      </div>
    </section>
  );
}
