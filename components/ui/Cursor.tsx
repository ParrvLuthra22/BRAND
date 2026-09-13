"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCursorStore } from "@/lib/cursor-store";

// How quickly the rendered dot catches up to the raw pointer position each
// frame — same lerp-toward-target technique as HeroCanvas's uMouse (0.08)
// and RailTransitionCanvas, just applied to a DOM transform instead of a
// GLSL uniform. Slightly snappier than those since this has to visually
// track the pointer itself, not an ambient displacement.
const LERP = 0.18;
const BASE_SIZE = 14; // px, resting dot diameter
const LABEL_SIZE = 72; // px, diameter while showing a context label

/**
 * Global custom cursor — a small dot that lerps toward the real pointer,
 * growing into a labeled circle over specific interactive zones ("VIEW" on
 * product cards, "DRAG" on the desktop rail, "ADD" on Add to Cart buttons —
 * each of those sets useCursorStore's label directly via onMouseEnter/
 * onMouseLeave, this component only reads it). `mix-blend-mode: difference`
 * (+ `isolate`, so the dot and its label blend as one unit against whatever
 * image is beneath them, rather than each independently) makes it invert
 * against both light and dark imagery without needing a light/dark variant.
 *
 * Mounted once in app/layout.tsx, like Loader/TopNav/CartDrawer/
 * CaptureModal. Renders nothing at all on touch devices or under
 * prefers-reduced-motion — same SSR-safe-default pattern used throughout
 * this codebase (starts inactive, upgraded pre-paint), and the native
 * cursor is only ever hidden while this is actually active, via a class on
 * <html> toggled in this component's own effect rather than a global CSS
 * rule that would apply unconditionally.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const label = useCursorStore((state) => state.label);

  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    setActive(!prefersReduced && !isTouch);
  }, []);

  useEffect(() => {
    if (!active) return;

    document.documentElement.classList.add("cursor-none");

    function onMove(event: MouseEvent) {
      target.current.x = event.clientX;
      target.current.y = event.clientY;
    }
    window.addEventListener("mousemove", onMove);

    let rafId = requestAnimationFrame(function loop() {
      pos.current.x += (target.current.x - pos.current.x) * LERP;
      pos.current.y += (target.current.y - pos.current.y) * LERP;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      document.documentElement.classList.remove("cursor-none");
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] flex items-center justify-center rounded-full bg-paper transition-[width,height] duration-200 ease-[var(--ease-out)]"
      style={{
        width: label ? LABEL_SIZE : BASE_SIZE,
        height: label ? LABEL_SIZE : BASE_SIZE,
        mixBlendMode: "difference",
        isolation: "isolate",
      }}
    >
      {label && <span className="mono-label text-bg">{label}</span>}
    </div>
  );
}
