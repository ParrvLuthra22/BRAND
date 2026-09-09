"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import {
  dispatchLoaderComplete,
  getCriticalPreloadTargets,
  hasLoaderPlayed,
  markLoaderPlayed,
} from "@/lib/loader";

const WORD = "BRAND";
// Glitch amplitude (px) at 0% load progress — converges to 0 at 100%.
const MAX_OFFSET = 24;

function randomGlitchBand() {
  const top = gsap.utils.random(0, 70);
  const height = gsap.utils.random(8, 30);
  const bottom = Math.max(0, 100 - top - height);
  return `inset(${top}% 0% ${bottom}% 0%)`;
}

export function Loader() {
  const [mounted, setMounted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0);
  const [wiping, setWiping] = useState(false);

  const reducedMotionRef = useRef(false);
  const ampRef = useRef(MAX_OFFSET);
  const rRef = useRef<HTMLSpanElement>(null);
  const bRef = useRef<HTMLSpanElement>(null);

  // Runs before first paint: resolve reduced-motion + "already played this
  // session" so the correct version is what actually gets painted — never a
  // flash of the wrong one.
  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    reducedMotionRef.current = prefersReduced;
    setReducedMotion(prefersReduced);

    if (hasLoaderPlayed()) {
      setMounted(false);
      dispatchLoaderComplete();
    }
  }, []);

  useEffect(() => {
    ampRef.current = MAX_OFFSET * (1 - progress / 100);
  }, [progress]);

  // Real asset preload — percentage is loaded-count / total, driven by
  // Promise.all resolving, never a fake timer.
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    const targets = getCriticalPreloadTargets();
    let loaded = 0;

    function complete() {
      if (cancelled) return;
      markLoaderPlayed();
      dispatchLoaderComplete();
      if (!reducedMotionRef.current) {
        gsap.set([rRef.current, bRef.current], {
          x: 0,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
        });
      }
      setWiping(true);
    }

    Promise.all(
      targets.map((target) =>
        target.load().then(() => {
          if (cancelled) return;
          loaded += 1;
          setProgress(Math.round((loaded / targets.length) * 100));
        })
      )
    ).then(complete);

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  // Glitch jitter loop. Self-scheduling with randomized delays so it reads
  // as glitchy rather than a metronome; amplitude tracks real load progress
  // via ampRef, so it naturally settles to aligned exactly as loading ends.
  useEffect(() => {
    if (!mounted || reducedMotionRef.current || wiping) return;
    let timeoutId: number;

    function tick() {
      const amp = ampRef.current;
      if (amp > 0.5) {
        gsap.set(rRef.current, {
          x: gsap.utils.random(-amp, amp),
          y: gsap.utils.random(-amp * 0.25, amp * 0.25),
          clipPath: randomGlitchBand(),
        });
        gsap.set(bRef.current, {
          x: gsap.utils.random(-amp, amp),
          y: gsap.utils.random(-amp * 0.25, amp * 0.25),
          clipPath: randomGlitchBand(),
        });
      } else {
        gsap.set([rRef.current, bRef.current], {
          x: 0,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
        });
      }
      timeoutId = window.setTimeout(tick, gsap.utils.random(60, 140));
    }

    tick();
    return () => window.clearTimeout(timeoutId);
  }, [mounted, wiping]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        setMounted(false);
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-bg"
      style={
        reducedMotion
          ? {
              opacity: wiping ? 0 : 1,
              transition: "opacity 0.15s linear",
            }
          : {
              clipPath: wiping
                ? "inset(0% 0% 100% 0%)"
                : "inset(0% 0% 0% 0%)",
              transition: "clip-path var(--dur-med) var(--ease-out)",
            }
      }
    >
      <span className="sr-only">Loading BRAND — {progress}%</span>

      {reducedMotion ? (
        <span
          aria-hidden
          className="text-hero font-display uppercase text-paper"
        >
          {WORD}
        </span>
      ) : (
        <div aria-hidden className="relative inline-block">
          <span
            className="relative text-hero font-display uppercase"
            style={{ color: "#00ff6a", mixBlendMode: "screen" }}
          >
            {WORD}
          </span>
          <span
            ref={rRef}
            className="absolute inset-0 text-hero font-display uppercase"
            style={{ color: "#ff003c", mixBlendMode: "screen" }}
          >
            {WORD}
          </span>
          <span
            ref={bRef}
            className="absolute inset-0 text-hero font-display uppercase"
            style={{ color: "#0090ff", mixBlendMode: "screen" }}
          >
            {WORD}
          </span>
        </div>
      )}

      <span aria-hidden className="mono-label text-muted">
        {String(progress).padStart(3, "0")}%
      </span>
    </div>
  );
}
