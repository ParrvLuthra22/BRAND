import type { Metadata } from "next";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = { title: "Lookbook — BRAND" };

// TODO: this is a holding page. The real lookbook is the planned full-bleed
// horizontal-scroll band between Manifesto and ShopGrid on the homepage
// (see CLAUDE.md's Tier-2 spec, not yet built) — once that exists, either
// replace this page with the real editorial content or point it there.
export default function LookbookPage() {
  return (
    <>
      <main className="mx-auto max-w-2xl px-6 py-32 md:px-10">
        <h1 className="text-display font-display uppercase text-paper">
          Lookbook
        </h1>
        <p className="mt-8 text-body text-paper">
          The full lookbook is still being shot. Check back soon — or follow
          the drop for previews as they land.
        </p>
      </main>
      <Footer />
    </>
  );
}
