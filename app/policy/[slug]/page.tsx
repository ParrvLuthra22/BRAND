import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/sections/Footer";

// TODO: every body string here is placeholder copy, not legally-reviewed
// policy text — swap it out before launch. The routes/structure are final;
// only the content needs to change.
const POLICY_CONTENT: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "We collect only what's needed to process your order and keep you posted on it — name, shipping address, and email. Payment details are handled entirely by our payment processor; we never see or store your card information.",
      "We don't sell your data. Marketing emails only go out if you've opted in, and you can unsubscribe at any time.",
    ],
  },
  terms: {
    title: "Terms of Service",
    body: [
      "By ordering from Brand, you're agreeing to pay the listed price for the size and quantity you select, and to provide accurate shipping information.",
      "All products are sold subject to availability. We reserve the right to cancel and fully refund any order we're unable to fulfill.",
    ],
  },
  shipping: {
    title: "Shipping",
    body: [
      "Orders ship within 24-48 hours of purchase. Delivery timelines vary by location and are shown at checkout before you pay.",
      "You'll get a tracking link by email the moment your order leaves the warehouse.",
    ],
  },
  returns: {
    title: "Returns",
    body: [
      "Not feeling it? Unworn items in original condition can be returned within 14 days of delivery for a full refund or exchange.",
      "Sale items are final sale unless defective — see our Refund policy for how defective items are handled.",
    ],
  },
  refund: {
    title: "Refund Policy",
    body: [
      "Approved refunds are issued to your original payment method within 5-7 business days of us receiving the returned item.",
      "Defective or incorrect items ship a free replacement — a return usually isn't required.",
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(POLICY_CONTENT).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = POLICY_CONTENT[slug];
  if (!entry) return {};
  return { title: `${entry.title} — BRAND` };
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const entry = POLICY_CONTENT[slug];
  if (!entry) notFound();

  return (
    <>
      <main className="mx-auto max-w-2xl px-6 py-32 md:px-10">
        <Link
          href="/"
          className="mono-label text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-paper"
        >
          ← Back
        </Link>
        <h1 className="mt-6 text-display font-display uppercase text-paper">
          {entry.title}
        </h1>
        <div className="mt-8 flex flex-col gap-4">
          {entry.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-body text-paper">
              {paragraph}
            </p>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
