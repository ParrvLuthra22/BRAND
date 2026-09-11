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
    <section ref={rootRef} className="relative h-screen w-full overflow-hidden">
      {useWebGL ? (
        <HeroCanvas
          src={HERO_IMAGE_SRC}
          className="absolute inset-0 -z-10"
          onError={handleWebGLError}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={HERO_IMAGE_SRC}
          alt=""
          aria-hidden
          // object-top, not the default center: hero.jpg is a tall portrait
          // with empty headroom above the subject's head near the very top
          // of the frame — on a wide/short viewport, object-cover has to
          // crop vertically, and centered cropping can cut the head off
          // entirely. Cropping from the bottom instead keeps the head (and
          // the wordmark's headroom above it) in frame. See heroShaders.ts's
          // coverUv for the same fix on the WebGL path.
          className="absolute inset-0 -z-10 h-full w-full object-cover object-top"
        />
      )}

      <div aria-hidden className="absolute inset-0 -z-[5] bg-bg/25" />

      <div className="relative z-10 flex h-full flex-col px-6 py-10 md:px-10">
        {/* Grouped at the top, not vertically centered — hero.jpg's subject
            is centered with their head starting ~22% down the frame, and
            object-cover preserves that full vertical extent at essentially
            every realistic viewport ratio (this image is narrow/tall enough
            that cropping only ever eats the sides, not the top/bottom). The
            wordmark's size is a bespoke vh-based clamp rather than the
            --text-hero token — text-hero's 18vw-driven max (20rem) badly
            overflows a ~20%-of-viewport-height budget on any normal desktop
            width, guaranteeing overlap with the face; sizing off vh instead
            keeps it inside the empty band above the head regardless of how
            wide the viewport is. */}
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
