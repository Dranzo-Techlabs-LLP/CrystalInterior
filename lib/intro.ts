/**
 * The logo intro (Preloader) plays once per visit. The hero waits for it, so
 * its headline arrives as the curtain lifts; `played` is false when the intro
 * was skipped (already seen, or reduced motion) and nothing should animate in.
 */
let result: { played: boolean } | null = null;
const waiting = new Set<(played: boolean) => void>();

export function markIntroDone(played: boolean) {
  if (result) return;
  result = { played };
  waiting.forEach((fn) => fn(played));
  waiting.clear();
}

/** Calls `fn` once the intro has finished (straight away if it already has). Returns an unsubscribe. */
export function onIntroDone(fn: (played: boolean) => void) {
  if (result) {
    fn(result.played);
    return () => {};
  }
  waiting.add(fn);
  return () => {
    waiting.delete(fn);
  };
}
