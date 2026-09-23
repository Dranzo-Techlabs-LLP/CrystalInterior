/**
 * Image URL helpers. Placeholder photography comes from Unsplash (free licence);
 * swap any id for the studio's own photography.
 */
export const photo = (id: string, w: number, h: number, q = 78) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=${q}`;

/**
 * A detail crop from the same photograph — how the collage shows one home
 * from several angles: `fx`/`fy` pick the point, `zoom` how close we get.
 */
export const detail = (id: string, w: number, h: number, fx: number, fy: number, zoom: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=focalpoint&fp-x=${fx}&fp-y=${fy}&fp-z=${zoom}&w=${w}&h=${h}&q=78`;
