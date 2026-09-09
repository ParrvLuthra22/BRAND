export function Footer() {
  return (
    <footer className="flex flex-col gap-6 border-t border-line px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10">
      <span className="text-h3 font-display uppercase text-paper">Brand</span>
      <span className="mono-label text-muted">
        © {new Date().getFullYear()} Brand. All rights reserved.
      </span>
    </footer>
  );
}
