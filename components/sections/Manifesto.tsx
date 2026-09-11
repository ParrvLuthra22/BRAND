"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/utils";
import { MANIFESTO_LOOP_WEBM_SRC, MANIFESTO_LOOP_MP4_SRC } from "@/lib/loader";

const LINES = ["NOT DESIGNED TO BLEND IN.", "BUILT TO TAKE UP SPACE."];

const MARQUEE_PHRASE = "TAKE UP SPACE";
const MARQUEE_REPEAT = 6;

function MarqueeGroup({ hidden }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-8">
      {Array.from({ length: MARQUEE_REPEAT }).map((_, i) => (
        <span key={i} className="mono-label shrink-0 text-muted">
          {MARQUEE_PHRASE} <span className="text-acid">—</span>
        </span>
      ))}
    </div>
  );
}

export function Manifesto() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-bg py-32 md:py-40">
      {/* Ambient background loop — the same editorial campaign clip that
          was originally tried in Hero. It reads better here: Manifesto has
          no "must show the whole photo" constraint the way Hero's rotation
          shot does, and a moving backdrop suits a brand-statement section
          more than it does a product hero. Kept explicitly dim (opacity-30
          composited over the section's own near-black bg-bg) — this is
          still meant to read as "near-black, heavy grain," per the top of
          this file's brief, not as a bright video section; the motion
          should be felt more than seen. z-0 + first in DOM, same as the
          text/marquee below it, not -z-10 — negative z-index on a
          position:relative element was a real bug in Hero (see its own
          CLAUDE.md gotcha); staying non-negative and using DOM order for
          stacking avoids that whole class of issue here. .grain-heavy's
          explicit z-10 still sits above everything regardless. */}
      {!prefersReducedMotion && (
        <video
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-30"
        >
          <source src={MANIFESTO_LOOP_WEBM_SRC} type="video/webm" />
          <source src={MANIFESTO_LOOP_MP4_SRC} type="video/mp4" />
        </video>
      )}

      <div className="grain-heavy" />

      <div className="relative z-0 flex flex-col gap-1 px-6 md:px-10">
        {LINES.map((line, i) => (
          <div key={line} className="overflow-hidden">
            <motion.p
              className="text-display font-display uppercase text-paper"
              initial={prefersReducedMotion ? false : { y: "100%" }}
              whileInView={{ y: "0%" }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: i * 0.12 }}
            >
              {line}
            </motion.p>
          </div>
        ))}
      </div>

      <div className="relative z-0 mt-24 overflow-hidden border-y border-line py-5">
        <div className="flex w-max animate-marquee items-center gap-8">
          <MarqueeGroup />
          <MarqueeGroup hidden />
        </div>
      </div>
    </section>
  );
}
