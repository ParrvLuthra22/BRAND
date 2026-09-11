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

export function Hero() {
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // SSR-safe default (matches first client render too, avoiding a hydration
  // mismatch) — upgraded to WebGL pre-paint in the useLayoutEffect below.
  const [useWebGL, setUseWebGL] = useState(false);

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
