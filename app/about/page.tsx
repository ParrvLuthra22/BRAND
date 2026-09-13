import type { Metadata } from "next";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = { title: "About — BRAND" };

// TODO: placeholder copy — real founding story / brand history pending.
export default function AboutPage() {
  return (
    <>
      <main className="mx-auto max-w-2xl px-6 py-32 md:px-10">
        <h1 className="text-display font-display uppercase text-paper">
          About
        </h1>
        <p className="mt-8 text-body text-paper">
          Brand makes heavyweight, oversized streetwear for people who don&rsquo;t
          need to say much to say a lot. No logos, no loud prints — just cut,
          weight, and the one color we allow ourselves.
        </p>
      </main>
      <Footer />
    </>
  );
}
