import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

// Named GSAP ease matching the --ease-out design token exactly
// (cubic-bezier(0.16, 1, 0.3, 1) === SVG path "M0,0 C0.16,1 0.3,1 1,1").
// GSAP core can't parse raw CSS cubic-bezier() strings, hence CustomEase.
export const EASE_OUT = "brandOut";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create(EASE_OUT, "M0,0 C0.16,1 0.3,1 1,1");
}

export { gsap, ScrollTrigger };
