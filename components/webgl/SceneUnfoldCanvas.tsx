"use client";

import { useEffect, useRef } from "react";

type SceneUnfoldCanvasProps = {
  images: HTMLImageElement[];
  /** Stable getter (wrap in useCallback) — read fresh every rAF tick. */
  getProgress: () => number;
  className?: string;
};

export function SceneUnfoldCanvas({
  images,
  getProgress,
  className,
}: SceneUnfoldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || images.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let lastFrameIndex = -1;

    const drawFrame = (index: number) => {
      const img = images[index];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      ctx.clearRect(0, 0, width, height);
      // Cover-fit: scale to fill, center-crop the overflow.
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      ctx.drawImage(img, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastFrameIndex = -1; // force a redraw at the new size
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let rafId = 0;

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      const progress = Math.min(1, Math.max(0, getProgress()));
      const frameIndex = Math.round(progress * (images.length - 1));
      if (frameIndex !== lastFrameIndex) {
        lastFrameIndex = frameIndex;
        drawFrame(frameIndex);
      }
    };
    const start = () => {
      if (rafId) return;
      loop();
    };
    const stop = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

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
    };
  }, [images, getProgress]);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
