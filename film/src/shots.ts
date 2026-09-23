/**
 * Photography for the films. Each shot is framed by a focal point (what stays
 * in frame on any aspect ratio) and an aim (where the camera walks toward).
 * All photos are requested at a fixed 3:2 crop so the maths below is exact.
 */
export const ASPECT = 1.5;

const photo = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${Math.round(w / ASPECT)}&q=85`;

export type ShotSpec = {
  src: string;
  focal: [number, number];
  aim: [number, number];
  /**
   * Paint over a small area (x0, y0, x1, y1) with the photo itself, sampled
   * from an offset (dx, dy): a clone stamp. All values are fractions of the photo.
   */
  retouch?: { rect: [number, number, number, number]; from: [number, number] };
};

export const shots = {
  /** A modern villa at dusk, walkway leading to the front door. */
  exterior: {
    src: photo("1706164971309-fb4785fe6ceb", 3840),
    focal: [0.5, 0.56],
    aim: [0.5, 0.58],
  },
  /** The entrance hall: travertine walls, slatted ceiling, doors at the end. */
  hall: {
    src: photo("1758448511533-e1502259fff6", 3000),
    focal: [0.4, 0.5],
    aim: [0.4, 0.5],
    // The lettering on the stone plaque, covered with the plain stone below it.
    retouch: { rect: [0.431, 0.53, 0.481, 0.545], from: [0, 0.015] },
  },
  /** The living room: book-matched marble wall and a hand-cut jaali screen. */
  living: {
    src: photo("1745301558339-44eb3217d5da", 3000),
    focal: [0.46, 0.5],
    aim: [0.55, 0.45],
  },
} satisfies Record<string, ShotSpec>;

/**
 * A quiet morning at home, for the ambient loop beside the reviews. Framed on
 * the reader and her book (the right of the photo), leaving the side table out.
 */
export const morning = {
  src: `https://images.unsplash.com/photo-1558713089-d1aad46c19bf?auto=format&w=2000&q=85`,
  position: "84% 45%",
  origin: "70% 62%",
};

/** Cover-fit an image of ASPECT into a W×H frame; returns box + aim point in px. */
export function cover(spec: ShotSpec, W: number, H: number) {
  const width = Math.max(W, H * ASPECT);
  const height = Math.max(H, W / ASPECT);
  const left = (W - width) * spec.focal[0];
  const top = (H - height) * spec.focal[1];
  return {
    left,
    top,
    width,
    height,
    originX: left + width * spec.aim[0],
    originY: top + height * spec.aim[1],
  };
}
