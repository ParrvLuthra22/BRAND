// Whether SceneUnfold's async frame-preload has resolved and its own pin
// has been created. SceneRail and Lookbook (both pinned sections after it
// in the DOM) need to know this before creating their OWN ScrollTriggers.
//
// Root cause this works around: SceneRail's and Lookbook's mount effects
// aren't gated behind anything async, so without this they reliably run
// and measure their own "top top" position *before* SceneUnfold's
// async-gated pin (and its pin-spacer) exists — at that moment SceneUnfold
// is still its natural, un-pinned 100vh, so they cache a start/end that's
// short by exactly SceneUnfold's own pin-extra scroll distance. Confirmed
// (the hard way — see git history) that nothing short of not creating the
// trigger too early actually fixes this in this codebase's Lenis-
// scrollerProxy setup: not a deferred ScrollTrigger.refresh(), not a
// native window resize (which ScrollTrigger listens to and refreshes on
// internally), not invalidateOnRefresh, not recreating the trigger with a
// fresh getBoundingClientRect()-based start function. The measurement
// itself is wrong from the moment it's taken; nothing re-takes it
// correctly afterward. Waiting to create the trigger until this is
// already true is the only fix that actually works.
let ready = false;
const listeners = new Set<() => void>();

export function markSceneUnfoldReady(): void {
  if (ready) return;
  ready = true;
  listeners.forEach((fn) => fn());
  listeners.clear();
}

export function isSceneUnfoldReady(): boolean {
  return ready;
}

/** Calls `fn` once SceneUnfold is ready — immediately if it already is. */
export function onSceneUnfoldReady(fn: () => void): () => void {
  if (ready) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => listeners.delete(fn);
}
