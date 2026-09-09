export function SceneUnfold() {
  return (
    <section className="relative h-[300vh] bg-bg-raised">
      {/* WebGL shader canvas mounts here — see components/webgl */}
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center gap-4">
        <span className="mono-label text-muted">Scene 01</span>
        <h2 className="text-display font-display uppercase text-paper">
          Unfold
        </h2>
      </div>
    </section>
  );
}
