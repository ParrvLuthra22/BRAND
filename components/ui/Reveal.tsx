"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger, EASE_OUT } from "@/lib/gsap";

type Direction = "up" | "left" | "right";

const CLIP_HIDDEN: Record<Direction, string> = {
  up: "inset(0% 0% 100% 0%)",
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
};
const CLIP_VISIBLE = "inset(0% 0% 0% 0%)";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Direction the clip-path wipes open from — "up" reveals bottom-to-top, etc. */
  direction?: Direction;
  /** Stagger delay in seconds, e.g. `(i % 4) * 0.06` for a grid. */
  delay?: number;
};

/**
 * Reusable one-shot clip-path scroll-reveal — the same mask-wipe pattern
 * TheDrop's detail panels and SpecStory's chapters already use inline,
 * generalized so other sections (ShopGrid's bento cells here; TheDrop/
 * SpecStory can migrate to this later without changing the visual result)
 * don't each hand-roll their own ScrollTrigger. Reveals once, the first
 * time the wrapped content is scrolled into view — never re-masks or
 * scrubs, matching every other one-shot reveal in this codebase.
 *
 * Skips the animation entirely under prefers-reduced-motion (renders
 * already-visible), the same pre-paint matchMedia check used throughout —
 * this is a manual check rather than framer-motion's useReducedMotion
 * since it's GSAP-driven, not a framer-motion effect.
 */
export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useLayoutEffect(() => {
    setPrefersReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  useEffect(() => {
    if (prefersReduced || !ref.current) return;
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: "top 90%",
      once: true,
      onEnter: () => {
        gsap.to(ref.current, {
          clipPath: CLIP_VISIBLE,
          duration: 1,
          delay,
          ease: EASE_OUT,
        });
      },
    });
    return () => trigger.kill();
  }, [prefersReduced, delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ clipPath: prefersReduced ? CLIP_VISIBLE : CLIP_HIDDEN[direction] }}
    >
      {children}
    </div>
  );
}
