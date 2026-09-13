"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { gsap } from "@/lib/gsap";
import { HERO_IMAGE_SRC } from "@/lib/loader";
import { products } from "@/data/products";
import { Reveal } from "@/components/ui/Reveal";
import { onSceneUnfoldReady } from "@/lib/scene-unfold-ready";

const SCROLL_PER_SLIDE_VH = 1;
const TEXT_PARALLAX = 45; // %, how far the kinetic type drifts per slide

const BONE = products.find((product) => product.id === "bone-hoodie")!;
const VENOM = products.find((product) => product.id === "venom-hoodie")!;

// The three full-length editorial shots that exist in this collection right
// now: the hero photo (full-body, uncropped — see Hero.tsx) plus BONE and
// VENOM's main shots (also full-body). ONYX/MONO's mains are the same kind
// of shot but aren't used here — three slides reads better than five for a
// horizontal band, and BONE/VENOM are explicitly the ones named in spec.
const SLIDES: { src: string; word: string; sub: string }[] = [
  { src: HERO_IMAGE_SRC, word: "HEAVY", sub: "Heavy. Cropped. Relentless." },
  { src: BONE.images.main, word: BONE.name, sub: BONE.moodLine },
  { src: VENOM.images.main, word: VENOM.name, sub: VENOM.moodLine },
];

function isMobileViewport(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

type Mode = "mobile" | "desktop" | "reduced";

export function Lookbook() {
  // SSR-safe default (mobile — lightest markup, no pin), upgraded pre-paint,
  // same pattern as SceneRail's mode check.
  const [mode, setMode] = useState<Mode>("mobile");
  // See lib/scene-unfold-ready.ts — same reasoning as SceneRail's identical
  // canPin gate: creating this section's pin before SceneUnfold's own
  // (async-gated) one exists caches a wrong start/end that nothing later
  // corrects.
  const [canPin, setCanPin] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLHeadingElement | null)[]>([]);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) setMode("reduced");
    else if (isMobileViewport()) setMode("mobile");
    else setMode("desktop");
  }, []);

  useEffect(() => onSceneUnfoldReady(() => setCanPin(true)), []);

  // Desktop: pin the section and translate the track exactly like
  // SceneRail's own rail — same formula, same reasoning (see that file).
  useEffect(() => {
    if (!canPin || mode !== "desktop" || !sectionRef.current || !trackRef.current) return;

    const itemCount = SLIDES.length;
    const travelX = () => (itemCount - 1) * window.innerWidth;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: () =>
          `+=${(itemCount - 1) * window.innerHeight * SCROLL_PER_SLIDE_VH}`,
        pin: true,
        scrub: true,
        anticipatePin: 1,
      },
    });

    tl.to(trackRef.current, { x: () => -travelX(), ease: "none", duration: 1 }, 0);

    // Kinetic type — each slide's headline drifts across its own slide as
    // you scrub through the whole section, same parallax technique as
    // SceneRail's backdrop/cutout drift (fromTo on the shared timeline).
    for (const el of textRefs.current) {
      if (!el) continue;
      tl.fromTo(
        el,
        { xPercent: TEXT_PARALLAX },
        { xPercent: -TEXT_PARALLAX, ease: "none", duration: 1 },
        0
      );
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [mode, canPin]);

  if (mode === "reduced") {
    return (
      <section className="bg-bg px-6 py-24 md:px-10">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
          {SLIDES.map((slide) => (
            <LookbookSlide
              key={slide.word}
              slide={slide}
              className="aspect-[3/4] w-[80%] shrink-0 snap-start md:w-[40%]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (mode === "mobile") {
    return <LookbookCarousel />;
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-bg"
    >
      <div ref={trackRef} className="absolute inset-0 flex">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.word}
            className="relative h-full w-screen shrink-0 overflow-hidden"
          >
            <Reveal
              className="absolute inset-0"
              direction={i % 2 === 0 ? "left" : "right"}
              delay={i * 0.1}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.src}
                alt={slide.word}
                className="h-full w-full object-cover"
              />
            </Reveal>
            <div aria-hidden className="absolute inset-0 bg-bg/35" />
            <h2
              ref={(el) => {
                textRefs.current[i] = el;
              }}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-center text-hero font-display uppercase text-paper mix-blend-difference"
            >
              {slide.word}
            </h2>
            <p className="absolute bottom-10 left-6 mono-label text-acid md:left-10">
              {slide.sub}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LookbookCarousel() {
  const [emblaRef] = useEmblaCarousel({ align: "start", dragFree: false });

  return (
    <section className="bg-bg px-6 py-16">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {SLIDES.map((slide) => (
            <LookbookSlide
              key={slide.word}
              slide={slide}
              className="aspect-[3/4] w-[85%] min-w-0 shrink-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LookbookSlide({
  slide,
  className,
}: {
  slide: { src: string; word: string; sub: string };
  className: string;
}) {
  return (
    <div className={className}>
      <div className="relative h-full overflow-hidden bg-concrete">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.src}
          alt={slide.word}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-bg/35" />
        <h2 className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-display font-display uppercase text-paper mix-blend-difference">
          {slide.word}
        </h2>
        <p className="absolute bottom-6 left-4 mono-label text-acid">
          {slide.sub}
        </p>
      </div>
    </div>
  );
}
