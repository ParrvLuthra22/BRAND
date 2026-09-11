import { products, type Product } from "@/data/products";
import { ProductCard } from "@/components/ui/ProductCard";

// No category field on Product — whether "hoodie" or "tee" appears in the id
// stands in for one, good enough for a simple same-type-first sort with no
// schema change. Substring, not a prefix split: "onyx-hoodie" needs to match
// the "hoodie" category same as "hoodie-concrete" does, and a plain
// id.split("-")[0] prefix check would put it in a category of its own.
// Plain native horizontal scroll, no GSAP/carousel — PDP stays fast.
function categoryOf(product: Product): "hoodie" | "tee" {
  return product.id.includes("hoodie") ? "hoodie" : "tee";
}

function relatedTo(product: Product, count = 4): Product[] {
  const category = categoryOf(product);
  const others = products.filter((p) => p.id !== product.id);
  const sameCategory = others.filter((p) => categoryOf(p) === category);
  const rest = others.filter((p) => categoryOf(p) !== category);
  return [...sameCategory, ...rest].slice(0, count);
}

export function RelatedProducts({ product }: { product: Product }) {
  const related = relatedTo(product);
  if (related.length === 0) return null;

  return (
    <section className="border-t border-line px-6 py-16 md:px-10 md:py-24">
      <h2 className="mb-10 text-h3 font-display uppercase text-paper">
        You May Also Like
      </h2>
      <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4">
        {related.map((relatedProduct) => (
          <ProductCard
            key={relatedProduct.id}
            product={relatedProduct}
            className="w-[70%] shrink-0 snap-start sm:w-[45%] lg:w-[23%]"
          />
        ))}
      </div>
    </section>
  );
}
