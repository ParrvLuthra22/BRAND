import { products } from "@/data/products";
import { ProductCard } from "@/components/ui/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

// Asymmetric bento placement, keyed by id rather than array index so the
// layout stays correct if the catalog's order ever changes. VENOM is the
// tall feature cell (spans both rows in column 1 — the acid-green cords are
// the collection's visual anchor, per TheDrop's same "featured" reasoning).
// BONE is the wide cell (it's the one light garment in the drop — CLAUDE.md
// calls it "the deliberate light-break," so it gets to breathe as the bright
// block rather than compete for space in a standard cell). ONYX and MONO
// fill the two standard cells under BONE. Mobile ignores all of this (no
// `md:` prefix reaches it) and just stacks every card full-width in catalog
// order, standard aspect-[3/4] shape — bento layouts don't survive a narrow
// viewport, plain stacking is the correct fallback, not a lesser version of
// the same idea.
const BENTO_CELL: Record<string, string> = {
  "venom-hoodie": "md:col-start-1 md:row-start-1 md:row-span-2",
  "bone-hoodie": "md:col-start-2 md:col-span-2 md:row-start-1",
  "onyx-hoodie": "md:col-start-2 md:row-start-2",
  "mono-tee": "md:col-start-3 md:row-start-2",
};

// The image fills whatever height is left over in its bento cell (flex-1,
// not a fixed aspect ratio) — the cell's own grid row/col span is what
// defines its shape here. `flex-1` (not `h-full`) because ProductCard's
// article is a flex column with the text/button block as siblings below
// this: `h-full` would size the image to the *whole* card and overflow past
// it once those siblings also claim space; `flex-1` + `min-h-0` correctly
// gives the image only the space remaining after they take their natural
// height. Mobile still gets the standard aspect-[3/4] box (everything else
// here is md:-gated), same reasoning as BENTO_CELL above.
const BENTO_IMAGE_CLASS =
  "relative aspect-[3/4] w-full overflow-hidden bg-concrete md:aspect-auto md:min-h-0 md:flex-1";

export function ShopGrid() {
  return (
    <section id="shop" className="scroll-mt-20 px-6 py-24 md:px-10">
      <h2 className="mb-12 text-h3 font-display uppercase text-paper">
        Shop the Drop
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:grid-rows-[22rem_22rem]">
        {products.map((product, i) => (
          <Reveal
            key={product.id}
            className={BENTO_CELL[product.id]}
            delay={(i % 4) * 0.06}
          >
            <div className="relative h-full overflow-hidden">
              {/* Half-cropped index number — large enough that the image
                  area above covers its top half, so it only reads clearly
                  behind the name/price text below the image (per spec:
                  "sits behind the product name"). Combines a faint fill
                  with a slightly stronger outline (-webkit-text-stroke) so
                  it stays legible as a graphic even where it isn't backed
                  by the image; browsers without stroke support just see
                  the faint fill, which still reads as intentional. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-6 -left-2 z-0 select-none text-[7rem] font-display uppercase leading-none md:-bottom-10 md:-left-4 md:text-[10rem]"
                style={{
                  color: "rgba(242, 240, 235, 0.12)",
                  WebkitTextStroke: "1px rgba(242, 240, 235, 0.4)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <ProductCard
                product={product}
                className="relative z-10 h-full"
                imageClassName={BENTO_IMAGE_CLASS}
              />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
