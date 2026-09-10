import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { products } from "@/data/products";
import { ProductOverview } from "@/components/sections/ProductOverview";
import { SpecStory } from "@/components/sections/SpecStory";
import { ProductFAQ } from "@/components/sections/ProductFAQ";
import { RelatedProducts } from "@/components/sections/RelatedProducts";
import { Footer } from "@/components/sections/Footer";

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) return {};
  return {
    title: `${product.name} — BRAND`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <>
      <ProductOverview product={product} />
      <SpecStory product={product} />
      <ProductFAQ product={product} />
      <RelatedProducts product={product} />
      <Footer />
    </>
  );
}
