"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/utils";

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
