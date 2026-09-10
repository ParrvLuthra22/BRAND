"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";

// Answers are derived from the product's own data rather than generic
// boilerplate, so "product-specific" actually means something — no new
// data fields needed, everything here already exists on Product.
function faqFor(product: Product): { question: string; answer: string }[] {
  return [
    {
      question: "What's the fit like?",
      answer: `${product.specs.cut}. If you're between sizes, size down for a tighter fit or stay true to size for the intended drape.`,
    },
    {
      question: "How do I wash it?",
      answer: `Machine wash cold, inside out, with like colors. Tumble dry low or hang dry to protect the ${product.specs.print.toLowerCase()}. Never iron directly over a print or puff placement.`,
    },
    {
      question: "What size should I get?",
      answer: `Runs true to size in our oversized block fit. Available in ${product.sizes[0]}–${product.sizes[product.sizes.length - 1]}. When in doubt, size down for a cleaner silhouette.`,
    },
    {
      question: "When does this drop or restock?",
      answer: product.soldOut
        ? "This one's sold out. Restocks aren't guaranteed — join the list below to hear first if it comes back."
        : "In stock now, shipped same week. Future drops go live first to the list — join below.",
    },
  ];
}

export function ProductFAQ({ product }: { product: Product }) {
  const faqs = faqFor(product);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="border-t border-line px-6 py-16 md:px-10 md:py-24">
      <h2 className="mb-10 text-h3 font-display uppercase text-paper">FAQ</h2>
      <div className="flex flex-col border-t border-line">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={faq.question} className="border-b border-line">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-body text-paper">{faq.question}</span>
                <span
                  className={cn(
                    "mono-label text-acid transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                    isOpen && "rotate-45"
                  )}
                  aria-hidden
                >
                  +
                </span>
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-[var(--dur-med)] ease-[var(--ease-out)]"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="mono-label pb-5 text-muted">{faq.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
