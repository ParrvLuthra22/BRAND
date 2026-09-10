"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, EASE_OUT } from "@/lib/gsap";
import { products } from "@/data/products";
import { SceneUnfoldCanvas } from "@/components/webgl/SceneUnfoldCanvas";

const FEATURED = products.find((product) => product.sequenceFrames?.length);
const FRAME_URLS = FEATURED?.sequenceFrames ?? [];

const PIN_DISTANCE_VH = 1.5; // ~150vh of scroll while pinned
const AUTOPLAY_DURATION = 1.2; // reduced-motion short fallback, seconds

function preloadSequence(urls: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          // Still resolve on 404 — the canvas skips incomplete images, and
          // preloading must never hang waiting on a missing frame.
          img.onerror = () => resolve(img);
          img.src = src;
        })
    )
  );
}

export function SceneUnfold() {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const autoplayedRef = useRef(false);

  useLayoutEffect(() => {
    setPrefersReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  // Preload the full sequence before any pin/scrub is enabled. Starts on
  // mount (page-load time for a homepage section) so it's normally long
  // done before the user scrolls this far; the loading label only shows if
  // they outscroll it.
  useEffect(() => {
    let cancelled = false;
    preloadSequence(FRAME_URLS).then((loaded) => {
      if (cancelled) return;
      setImages(loaded);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getProgress = useCallback(() => progressRef.current, []);

  // Full pinned, scroll-scrubbed reveal. Deliberately no ScrollTrigger
  // .refresh() call here — the pin measures the current layout correctly
  // as part of its own creation. Calling .refresh() right after creating a
  // fresh pin was observed to snap the page's scroll position elsewhere
  // (ScrollTrigger reconciling pin progress against a just-changed
  // document height); it isn't needed for correctness on first creation,
  // only when an *existing* trigger's measurements have gone stale.
  useEffect(() => {
    if (!ready || prefersReduced || !sectionRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: () => `+=${window.innerHeight * PIN_DISTANCE_VH}`,
        pin: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      },
    });

    // All three run across the same scroll range, "ease: none" so they
    // track scroll position directly — Lenis already supplies the smoothing.
    tl.fromTo(
      headlineRef.current,
      { xPercent: 120 },
      { xPercent: -120, ease: "none", duration: 1 },
      0
    )
      .fromTo(
        bgRef.current,
        { backgroundColor: "#0A0A0A" },
        { backgroundColor: "#2A2A2A", ease: "none", duration: 1 },
        0
      )
      // The garment "emerges" early (first ~35%), then stays fully revealed
      // while the headline sweep and background shift keep developing.
      .fromTo(
        maskRef.current,
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", ease: "none", duration: 0.35 },
        0
      );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [ready, prefersReduced]);

  // Reduced motion: no pin. A short, one-time autoplay through the sequence
  // the first time the section is reached, then it just rests on the final
  // (already-composed) frame.
  useEffect(() => {
    if (!ready || !prefersReduced || !sectionRef.current) return;
    if (images.length === 0) return;

    const section = sectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || autoplayedRef.current) return;
        autoplayedRef.current = true;
        const frame = { value: 0 };
        gsap.to(frame, {
          value: images.length - 1,
          duration: AUTOPLAY_DURATION,
          ease: EASE_OUT,
          onUpdate: () => {
            progressRef.current = frame.value / (images.length - 1);
          },
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [ready, prefersReduced, images.length]);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-bg"
    >
      {!ready ? (
        <div className="flex h-full items-center justify-center">
          <span className="mono-label text-muted">Loading</span>
        </div>
      ) : (
        <>
          <div
            ref={bgRef}
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundColor: "#0A0A0A" }}
          />

          <div
            ref={maskRef}
            aria-hidden
            className="absolute inset-0"
            style={{
              clipPath: prefersReduced
                ? "inset(0% 0% 0% 0%)"
                : "inset(0% 0% 100% 0%)",
            }}
          >
            <SceneUnfoldCanvas
              images={images}
              getProgress={getProgress}
              className="absolute inset-0"
            />
          </div>

          <div className="relative z-10 flex h-full items-center justify-center">
            <h2
              ref={headlineRef}
              className="mix-blend-difference whitespace-nowrap text-hero font-display uppercase text-paper"
              style={{
                transform: prefersReduced ? undefined : "translateX(120%)",
              }}
            >
              Unfold
            </h2>
          </div>
        </>
      )}
    </section>
  );
}
