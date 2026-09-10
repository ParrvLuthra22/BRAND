import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The --ease-out design token (cubic-bezier(0.16, 1, 0.3, 1)), as a
// framer-motion-compatible easing array. Framer Motion accepts a raw
// [x1,y1,x2,y2] bezier directly — unlike GSAP, no CustomEase plugin/
// registration needed (see lib/gsap.ts's EASE_OUT for that version).
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
