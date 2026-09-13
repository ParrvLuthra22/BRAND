"use client";

import Link from "next/link";
import { useCaptureModalStore } from "@/lib/capture-modal-store";
import { products } from "@/data/products";
import { SUPPORT_EMAIL, WHATSAPP_NUMBER } from "@/lib/contact";

const BRAND_LINKS = [
  { href: "/about", label: "About" },
  { href: "/lookbook", label: "Lookbook" },
  { href: "/contact", label: "Contact" },
];

const POLICY_LINKS = [
  { href: "/policy/privacy", label: "Privacy" },
  { href: "/policy/terms", label: "Terms" },
  { href: "/policy/shipping", label: "Shipping" },
  { href: "/policy/returns", label: "Returns" },
  { href: "/policy/refund", label: "Refund" },
];

// TODO: placeholder handles — no real social accounts exist yet.
const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://tiktok.com", label: "TikTok" },
];

const LINK_CLASS =
  "mono-label text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-paper";

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="mono-label text-acid">{heading}</span>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={LINK_CLASS}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const openCaptureModal = useCaptureModalStore((state) => state.open);

  const shopLinks = [
    ...products.map((product) => ({
      href: `/products/${product.id}`,
      label: product.name,
    })),
    { href: "/#shop", label: "Shop All" },
  ];

  return (
    <footer className="border-t border-line px-6 py-16 md:px-10">
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
        <FooterColumn heading="Shop" links={shopLinks} />
        <FooterColumn heading="Brand" links={BRAND_LINKS} />
        <FooterColumn heading="Policy" links={POLICY_LINKS} />

        <div className="flex flex-col gap-4">
          <span className="mono-label text-acid">Contact</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK_CLASS}>
            {SUPPORT_EMAIL}
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mono-label inline-flex w-fit items-center rounded-full border border-acid px-5 py-2.5 text-acid transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-acid hover:text-bg"
          >
            WhatsApp Us
          </a>
          <div className="flex gap-4 pt-1">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-col items-start gap-6 border-t border-line pt-10 md:flex-row md:items-center md:justify-between">
        <span className="text-h3 font-display uppercase text-paper">Brand</span>
        <button
          onClick={openCaptureModal}
          className="mono-label rounded-full border border-acid px-6 py-3 text-acid transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-acid hover:text-bg"
        >
          Join the Cult
        </button>
      </div>

      {/* TODO: confirm the real registered legal entity name before launch —
          "Brand Retail Pvt. Ltd." is a placeholder, not an actual entity. */}
      <div className="mt-6 flex flex-col gap-1">
        <span className="mono-label text-muted">
          Brand Retail Pvt. Ltd. — all rights reserved.
        </span>
        <span className="mono-label text-muted">
          © {new Date().getFullYear()} Brand.
        </span>
      </div>
    </footer>
  );
}

