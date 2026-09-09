export function TheDrop() {
  return (
    <section className="flex flex-col items-center gap-8 px-6 py-24 text-center md:px-10">
      <span className="mono-label text-muted">Latest Drop</span>
      <h2 className="text-display font-display uppercase text-paper">
        Blackout
      </h2>
      <button className="rounded-full bg-acid px-8 py-4 mono-label text-bg transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-acid-dim">
        Shop the drop
      </button>
    </section>
  );
}
