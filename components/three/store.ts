/**
 * Shared, mutable state between the DOM scroll timelines and the 3D scenes.
 * Both scenes render on demand, so whatever changes a value calls `invalidate`.
 */
export const room = { p: 0, invalidate: undefined as (() => void) | undefined };
export const gem = { turn: 0, tiltX: 0, tiltY: 0, invalidate: undefined as (() => void) | undefined };

/** Scroll progress (0–1) at which each of the room's five build steps begins. */
export const ROOM_STEPS = [0, 0.2, 0.42, 0.6, 0.8] as const;
