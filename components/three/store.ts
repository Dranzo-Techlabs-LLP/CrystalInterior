/**
 * Shared, mutable state between the DOM scroll timelines and the 3D scenes.
 * The scenes render on demand, so whatever changes a value calls `invalidate`.
 */
export const room = { p: 0, invalidate: undefined as (() => void) | undefined };
export const gem = { turn: 0, tiltX: 0, tiltY: 0, invalidate: undefined as (() => void) | undefined };
/** The material moodboard: scroll progress, whether it is on screen (it floats while it is), and the pointer lean. */
export const board = {
  p: 0,
  active: false,
  leanX: 0,
  leanY: 0,
  invalidate: undefined as (() => void) | undefined,
};

/**
 * The 3D scenes warm up one after another as soon as the page has settled
 * (the crystal, then the moodboard, then the room), each waiting for the one
 * before it to be drawing, so they never compete, and each is ready long before
 * the visitor scrolls to it.
 */
type Scene = "gem" | "board" | "room";
const drawing = new Set<Scene>();
const waiting = new Map<Scene, Set<() => void>>();

export function sceneReady(scene: Scene) {
  drawing.add(scene);
  waiting.get(scene)?.forEach((fn) => fn());
  waiting.delete(scene);
}

/** Calls `fn` once `scene` is drawing (straight away if it already is). Returns an unsubscribe. */
export function afterScene(scene: Scene, fn: () => void) {
  if (drawing.has(scene)) {
    fn();
    return () => {};
  }
  const list = waiting.get(scene) ?? new Set();
  list.add(fn);
  waiting.set(scene, list);
  return () => {
    list.delete(fn);
  };
}

/** Scroll progress (0–1) at which each of the room's five build steps begins. */
export const ROOM_STEPS = [0, 0.2, 0.42, 0.6, 0.8] as const;

/** When sample `i` (in landing order) leaves the air and when it is down on the table. */
export function landing(i: number) {
  const from = 0.12 + i * 0.05;
  return { from, to: from + 0.2 };
}
