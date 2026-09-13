import type { Metadata } from "next";
import { Footer } from "@/components/sections/Footer";
import { SUPPORT_EMAIL, WHATSAPP_NUMBER } from "@/lib/contact";

export const metadata: Metadata = { title: "Contact — BRAND" };

export default function ContactPage() {
  return (
    <>
      <main className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-32 md:px-10">
        <h1 className="text-display font-display uppercase text-paper">
          Contact
        </h1>
        <p className="text-body text-paper">
          Order questions, sizing help, or just want to talk to a person —
          we&rsquo;re fastest on WhatsApp.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mono-label text-acid transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-acid-dim"
          >
            {SUPPORT_EMAIL}
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mono-label inline-flex w-fit items-center rounded-full border border-acid px-6 py-3 text-acid transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-acid hover:text-bg"
          >
            WhatsApp Us
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
