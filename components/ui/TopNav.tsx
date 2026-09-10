"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollTrigger } from "@/lib/gsap";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

export function TopNav() {
  const [visible, setVisible] = useState(false);
  const toggleCart = useCartStore((state) => state.toggle);
  const cartCount = useCartStore((state) =>
    state.lines.reduce((sum, line) => sum + line.quantity, 0)
  );

  // Trigger-less ScrollTrigger — no `trigger` element, so start/end are
  // plain scroll-position numbers rather than "element crosses viewport"
  // strings. Hidden at the very top (Hero is deliberately chrome-free),
  // appears once the user has actually started scrolling.
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 80,
      end: "max",
      onEnter: () => setVisible(true),
      onLeaveBack: () => setVisible(false),
    });
    return () => trigger.kill();
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-6 py-4 backdrop-blur-sm transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] md:px-10",
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      <Link href="/" className="text-h3 font-display uppercase text-paper">
        Brand
      </Link>
      <nav className="flex items-center gap-6">
        <Link
          href="/#shop"
          className="mono-label text-paper transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-acid"
        >
          Shop
        </Link>
        <button
          onClick={toggleCart}
          aria-label="Open cart"
          className="mono-label text-paper transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-acid"
        >
          Cart ({cartCount})
        </button>
      </nav>
    </header>
  );
}
