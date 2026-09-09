import { products } from "@/data/products";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ShopGrid() {
  return (
    <section className="px-6 py-24 md:px-10">
      <h2 className="mb-12 text-h3 font-display uppercase text-paper">
        Shop
      </h2>
      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex flex-col gap-3 bg-bg p-6"
          >
            <span className="mono-label text-muted">{product.colorway}</span>
            <h3 className="text-h3 font-display uppercase text-paper">
              {product.name}
            </h3>
            <p className="mono-label text-acid">{product.moodLine}</p>
            <div className="mt-2 flex items-baseline gap-2">
              {product.priceSale ? (
                <>
                  <span className="mono-label text-sale">
                    {formatPrice(product.priceSale)}
                  </span>
                  <span className="mono-label text-muted line-through">
                    {formatPrice(product.priceMRP)}
                  </span>
                </>
              ) : (
                <span className="mono-label text-paper">
                  {formatPrice(product.priceMRP)}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
