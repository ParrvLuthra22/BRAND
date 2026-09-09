"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { LOADER_COMPLETE_EVENT, hasLoaderPlayed } from "@/lib/loader";

export function Hero() {
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const startedRef = useRef(false);

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
    if (!ready || !rootRef.current) return;
    const targets = rootRef.current.querySelectorAll("[data-hero-in]");
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      gsap.set(targets, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      targets,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.12 }
    );
  }, [ready]);

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-screen flex-col justify-between px-6 py-10 md:px-10"
    >
      <span data-hero-in className="mono-label text-muted opacity-0">
        Brand / SS26
      </span>

      <h1
        data-hero-in
        className="text-hero font-display uppercase text-paper opacity-0"
      >
        Brand
      </h1>

      <div className="flex items-end justify-between">
        <p data-hero-in className="mono-label text-acid opacity-0">
          Heavy. Cropped. Relentless.
        </p>
        <span data-hero-in className="mono-label text-muted opacity-0">
          Scroll
        </span>
      </div>
    </section>
  );
}
