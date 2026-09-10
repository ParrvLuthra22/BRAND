"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Texture, Triangle, Vec2 } from "ogl";
import { heroFragmentShader, heroVertexShader } from "@/components/webgl/heroShaders";

// Hero's uHover runs 0..1 on pointer hover; capped much lower here so the
// rail's between-items pulse reads as "light," not a full Hero-strength hit.
const MAX_DISTORTION = 0.35;

type RailTransitionCanvasProps = {
  /** One backdrop image per rail item, in order. */
  images: HTMLImageElement[];
  /** Stable getter (wrap in useCallback) — the rail's scroll progress, 0..1. */
  getProgress: () => number;
  className?: string;
};

// Reuses Hero's exact OGL program (components/webgl/heroShaders.ts) as a
// single shared overlay: invisible at rest, fading in with a brief
// RGB-shift/displacement pulse exactly as scroll crosses between two
// items, showing whichever item is nearest so the pulse masks the swap.
export function RailTransitionCanvas({
  images,
  getProgress,
  className,
}: RailTransitionCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || images.length === 0) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        canvas,
        dpr: Math.min(window.devicePixelRatio, 2),
        alpha: false,
        antialias: false,
      });
    } catch {
      return;
    }
    const gl = renderer.gl;
    if (!gl) return;
    gl.clearColor(0.04, 0.04, 0.04, 1);

    const program = new Program(gl, {
      vertex: heroVertexShader,
      fragment: heroFragmentShader,
      uniforms: {
        uTexture: { value: new Texture(gl) },
        uMouse: { value: new Vec2(0, 0) },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uResolution: { value: new Vec2(1, 1) },
        uImageSize: { value: new Vec2(1, 1) },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value.set(width, height);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let lastIndex = -1;
    const setTextureForIndex = (index: number) => {
      const img = images[index];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      const texture = program.uniforms.uTexture.value as Texture;
      texture.image = img;
      program.uniforms.uImageSize.value.set(img.naturalWidth, img.naturalHeight);
      lastIndex = index;
    };
    setTextureForIndex(0);

    let rafId = 0;
    let contextLost = false;
    const clockStart = performance.now();
    const itemCount = images.length;

    const loop = () => {
      rafId = requestAnimationFrame(loop);

      const progress = Math.min(1, Math.max(0, getProgress()));
      const trackPosition = progress * (itemCount - 1);
      const nearestIndex = Math.round(trackPosition);
      if (nearestIndex !== lastIndex) setTextureForIndex(nearestIndex);

      // 0 centered on an item, 1 exactly at the midpoint to the next/prev —
      // smoothstepped so the pulse eases in/out instead of ramping linearly.
      const t = Math.min(1, Math.abs(trackPosition - nearestIndex) * 2);
      const transition = t * t * (3 - 2 * t);

      program.uniforms.uHover.value = transition * MAX_DISTORTION;
      program.uniforms.uTime.value = (performance.now() - clockStart) / 1000;
      canvas.style.opacity = String(transition);

      renderer.render({ scene: mesh });
    };
    const start = () => {
      if (rafId || contextLost) return;
      loop();
    };
    const stop = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(container);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      if (!contextLost) gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [images, getProgress]);

  return (
    <div ref={containerRef} className={className}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ opacity: 0 }}
      />
    </div>
  );
}
