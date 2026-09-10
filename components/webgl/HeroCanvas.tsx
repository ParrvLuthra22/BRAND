"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Texture, Triangle, Vec2 } from "ogl";
import { gsap, EASE_OUT } from "@/lib/gsap";
import { heroFragmentShader, heroVertexShader } from "@/components/webgl/heroShaders";

const MOUSE_LERP = 0.08;
const HOVER_DURATION = 0.6;

type HeroCanvasProps = {
  src: string;
  className?: string;
  /** WebGL context creation failed at runtime — caller should fall back. */
  onError?: () => void;
};

export function HeroCanvas({ src, className, onError }: HeroCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        canvas,
        dpr: Math.min(window.devicePixelRatio, 2),
        alpha: false,
        antialias: false,
      });
    } catch {
      onError?.();
      return;
    }

    const gl = renderer.gl;
    if (!gl) {
      onError?.();
      return;
    }
    gl.clearColor(0.04, 0.04, 0.04, 1);

    const targetMouse = new Vec2(0, 0);
    const liveMouse = new Vec2(0, 0);

    const program = new Program(gl, {
      vertex: heroVertexShader,
      fragment: heroFragmentShader,
      uniforms: {
        uTexture: { value: new Texture(gl) },
        uMouse: { value: liveMouse },
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

    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const texture = program.uniforms.uTexture.value as Texture;
      texture.image = image;
      program.uniforms.uImageSize.value.set(image.naturalWidth, image.naturalHeight);
    };
    image.src = src;

    const setMouseFromEvent = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouse.set(
        (event.clientX - rect.left) / rect.width - 0.5,
        0.5 - (event.clientY - rect.top) / rect.height
      );
    };
    function onPointerMove(event: PointerEvent) {
      setMouseFromEvent(event);
    }
    function onPointerEnter(event: PointerEvent) {
      setMouseFromEvent(event);
      gsap.to(program.uniforms.uHover, {
        value: 1,
        duration: HOVER_DURATION,
        ease: EASE_OUT,
        overwrite: true,
      });
    }
    function onPointerLeave() {
      gsap.to(program.uniforms.uHover, {
        value: 0,
        duration: HOVER_DURATION,
        ease: EASE_OUT,
        overwrite: true,
      });
    }
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerenter", onPointerEnter);
    container.addEventListener("pointerleave", onPointerLeave);

    let rafId = 0;
    let contextLost = false;
    const clockStart = performance.now();

    function loop() {
      rafId = requestAnimationFrame(loop);
      liveMouse.set(
        liveMouse.x + (targetMouse.x - liveMouse.x) * MOUSE_LERP,
        liveMouse.y + (targetMouse.y - liveMouse.y) * MOUSE_LERP
      );
      program.uniforms.uTime.value = (performance.now() - clockStart) / 1000;
      renderer.render({ scene: mesh });
    }
    function start() {
      if (rafId || contextLost) return;
      loop();
    }
    function stop() {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }

    // The GPU can reclaim a context at any time (backgrounded tab under
    // memory pressure, driver reset). Once lost, the compiled program and
    // uploaded texture are gone too — recovering in place would mean
    // rebuilding the whole pipeline, so just hand off to the <img> fallback.
    function onContextLost(event: Event) {
      event.preventDefault();
      contextLost = true;
      stop();
      onError?.();
    }
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
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerenter", onPointerEnter);
      container.removeEventListener("pointerleave", onPointerLeave);
      gsap.killTweensOf(program.uniforms.uHover);
      if (!contextLost) gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [src, onError]);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
