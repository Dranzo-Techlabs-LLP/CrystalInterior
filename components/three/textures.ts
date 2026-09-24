import * as THREE from "three";
import { whenIdle } from "@/lib/webgl";

/**
 * Every surface texture for the 3D scenes, drawn in code on 2D canvases:
 * nothing to download, and the same seeded grain on every visit. Painting is
 * the slow part of setting a scene up, so it can be done ahead of time, one
 * surface per idle moment (`prepareTextures`), and is then only wrapped when
 * the scene mounts.
 */

function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Draw = (g: CanvasRenderingContext2D, r: () => number, w: number, h: number) => void;

function paint(w: number, h: number, seed: number, draw: Draw) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!, random(seed), w, h);
  return canvas;
}

/** A surface to paint: size, seed and how. */
type Recipe = { w: number; h: number; seed: number; draw: Draw };

/** Painted surfaces, kept for the life of the page (a scene that remounts reuses them). */
const painted = new Map<string, HTMLCanvasElement>();

function paintOnce(key: string, { w, h, seed, draw }: Recipe) {
  let canvas = painted.get(key);
  if (!canvas) {
    canvas = paint(w, h, seed, draw);
    painted.set(key, canvas);
  }
  return canvas;
}

function texture(canvas: HTMLCanvasElement, { color = true, repeat = [1, 1] as [number, number] } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  return t;
}

/** Walnut: a soft figure with fine, slightly wandering grain running along v. */
const walnut: Draw = (g, r, w, h) => {
  g.fillStyle = "#6b4431";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) {
    const x = r() * w;
    const half = 30 + r() * 70;
    const band = g.createLinearGradient(x - half, 0, x + half, 0);
    band.addColorStop(0, "rgba(40,22,12,0)");
    band.addColorStop(0.5, `rgba(40,22,12,${0.08 + r() * 0.12})`);
    band.addColorStop(1, "rgba(40,22,12,0)");
    g.fillStyle = band;
    g.fillRect(x - half, 0, half * 2, h);
  }
  for (let i = 0; i < 320; i++) {
    let x = r() * w;
    g.strokeStyle = r() < 0.6 ? `rgba(35,20,11,${0.1 + r() * 0.25})` : `rgba(170,120,80,${0.06 + r() * 0.14})`;
    g.lineWidth = 0.5 + r() * 1.8;
    g.beginPath();
    g.moveTo(x, 0);
    for (let y = 32; y <= h; y += 32) {
      x += (r() - 0.5) * 3;
      g.lineTo(x, y);
    }
    g.stroke();
  }
};

/** Travertine veining: soft horizontal bands and small pores. */
function veins(g: CanvasRenderingContext2D, r: () => number, x: number, y: number, w: number, h: number, count: number) {
  for (let v = 0; v < count; v++) {
    g.fillStyle = r() < 0.5 ? `rgba(160,135,100,${0.05 + r() * 0.08})` : `rgba(255,250,240,${0.08 + r() * 0.1})`;
    g.fillRect(x, y + r() * h, w, 2 + r() * (h / 25));
  }
  for (let k = 0; k < count * 9; k++) {
    g.fillStyle = `rgba(140,115,85,${0.1 + r() * 0.2})`;
    g.beginPath();
    g.ellipse(x + r() * w, y + r() * h, 1 + r() * 4, 0.6 + r() * 1.2, 0, 0, Math.PI * 2);
    g.fill();
  }
}

/** Floor: 1.2 × 0.6 m travertine tiles in a running bond (the canvas is 2.4 m square). */
const tiles: Draw = (g, r, w, h) => {
  const tw = w / 2;
  const th = h / 4;
  const tile = document.createElement("canvas");
  tile.width = tw;
  tile.height = th;
  const t = tile.getContext("2d")!;
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 ? tw / 2 : 0;
    for (let col = 0; col < 2; col++) {
      const tone = 0.94 + r() * 0.06;
      t.fillStyle = `rgb(${226 * tone},${212 * tone},${190 * tone})`;
      t.fillRect(0, 0, tw, th);
      veins(t, r, 0, 0, tw, th, 7);
      t.strokeStyle = "rgba(150,128,100,0.55)";
      t.lineWidth = 2;
      t.strokeRect(1, 1, tw - 2, th - 2);
      // draw it twice where it crosses the edge, so the texture tiles seamlessly
      const x = col * tw + offset;
      g.drawImage(tile, x, row * th);
      if (x + tw > w) g.drawImage(tile, x - w, row * th);
    }
  }
};

/** Stone slab (table and sideboard tops): travertine without grout. */
const slab: Draw = (g, r, w, h) => {
  g.fillStyle = "#e6dac8";
  g.fillRect(0, 0, w, h);
  veins(g, r, 0, 0, w, h, 16);
};

const linen: Draw = (g, r, w, h) => {
  g.fillStyle = "#ece4d7";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < h; i += 2) {
    g.fillStyle = `rgba(120,100,80,${r() * 0.07})`;
    g.fillRect(0, i, w, 1);
    g.fillStyle = `rgba(255,255,255,${r() * 0.08})`;
    g.fillRect(i, 0, 1, h);
  }
};

/** An ivory wool rug with a black double border, like the rule under the logo's name. */
const rug: Draw = (g, r, w, h) => {
  g.fillStyle = "#ece5d7";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(120,105,85,${r() * 0.08})` : `rgba(255,252,245,${r() * 0.1})`;
    g.fillRect(r() * w, r() * h, 2, 1);
  }
  g.strokeStyle = "#141414";
  g.lineWidth = w * 0.022;
  g.strokeRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88);
  g.lineWidth = w * 0.008;
  g.strokeRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
};

const plaster: Draw = (g, r, w, h) => {
  g.fillStyle = "#f2ebdf";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 10 + r() * 40;
    const blot = g.createRadialGradient(x, y, 0, x, y, rad);
    const shade = r() < 0.5 ? "160,140,115" : "255,252,246";
    blot.addColorStop(0, `rgba(${shade},${0.04 + r() * 0.05})`);
    blot.addColorStop(1, `rgba(${shade},0)`);
    g.fillStyle = blot;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
};

/** The jaali: a quatrefoil lattice. White is solid stone, black is open. */
const lattice: Draw = (g, _r, w, h) => {
  g.fillStyle = "#fff";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#000";
  const n = 6;
  const s = Math.min(w, h) / n;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const cx = (i + 0.5) * s;
      const cy = (j + 0.5) * s;
      const rad = s * 0.19;
      if (i < n && j < n) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          g.beginPath();
          g.arc(cx + dx * rad * 0.95, cy + dy * rad * 0.95, rad, 0, Math.PI * 2);
          g.fill();
        }
      }
      const qx = i * s;
      const qy = j * s;
      const q = s * 0.11;
      g.beginPath();
      g.moveTo(qx, qy - q);
      g.lineTo(qx + q, qy);
      g.lineTo(qx, qy + q);
      g.lineTo(qx - q, qy);
      g.closePath();
      g.fill();
    }
  }
};

/** An abstract canvas for the wall, in the studio's colours: a black arch, a yellow sun, a sand horizon. */
const art: Draw = (g, r, w, h) => {
  g.fillStyle = "#f1ebdf";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#d8c9ad";
  g.fillRect(0, h * 0.74, w, h * 0.26);
  g.fillStyle = "#ffcb04";
  g.beginPath();
  g.arc(w * 0.66, h * 0.52, h * 0.24, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#121212";
  g.beginPath();
  g.moveTo(w * 0.2, h);
  g.lineTo(w * 0.2, h * 0.5);
  g.arc(w * 0.34, h * 0.5, w * 0.14, Math.PI, 0);
  g.lineTo(w * 0.48, h);
  g.closePath();
  g.fill();
  // three thin bars, as in the logo
  [0.8, 0.84, 0.865].forEach((x, i) => {
    g.fillRect(w * x, h * 0.14, w * [0.022, 0.014, 0.006][i], h * 0.56);
  });
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(90,70,50,${r() * 0.05})`;
    g.fillRect(r() * w, r() * h, 1.5, 1.5);
  }
};

/** A marble vein: a wandering line drawn soft, then sharper, then fine, so it reads as stone and not as ink. */
function vein(
  g: CanvasRenderingContext2D,
  r: () => number,
  x: number,
  y: number,
  length: number,
  angle: number,
  width: number,
  rgb: string,
  alpha: number,
) {
  const points: [number, number][] = [[x, y]];
  let a = angle;
  for (let d = 0; d < length; d += 5) {
    a += (r() - 0.5) * 0.32;
    x += Math.cos(a) * 5;
    y += Math.sin(a) * 5;
    points.push([x, y]);
  }
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const [lw, la] of [
    [width * 6, alpha * 0.06],
    [width * 2.4, alpha * 0.2],
    [width, alpha],
  ]) {
    g.strokeStyle = `rgba(${rgb},${la})`;
    g.lineWidth = lw;
    g.beginPath();
    points.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    g.stroke();
  }
  return points;
}

/** Soft clouds of tone under the veins, which give polished stone its depth. */
function clouds(g: CanvasRenderingContext2D, r: () => number, w: number, h: number, tones: string[], count: number) {
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 30 + r() * 120;
    const blot = g.createRadialGradient(x, y, 0, x, y, rad);
    const tone = tones[Math.floor(r() * tones.length)];
    blot.addColorStop(0, `rgba(${tone},${0.1 + r() * 0.16})`);
    blot.addColorStop(1, `rgba(${tone},0)`);
    g.fillStyle = blot;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

/** Nero Marquina: near-black stone with bright white veins and a fine crackle. */
const marbleDark: Draw = (g, r, w, h) => {
  g.fillStyle = "#111113";
  g.fillRect(0, 0, w, h);
  clouds(g, r, w, h, ["44,44,50", "0,0,0", "30,30,34"], 70);
  for (let i = 0; i < 6; i++) {
    const main = vein(g, r, -w * 0.2 + r() * w * 0.3, r() * h, w * 1.5, 0.3 + (r() - 0.5) * 0.6, 0.9 + r() * 1.4, "236,233,226", 0.9);
    // branches leave the main veins at a slant
    for (let b = 0; b < 3; b++) {
      const [bx, by] = main[Math.floor(r() * main.length)];
      vein(g, r, bx, by, 40 + r() * 140, (r() - 0.5) * 2.4, 0.5 + r() * 0.5, "226,223,216", 0.6);
    }
  }
  for (let i = 0; i < 45; i++) vein(g, r, r() * w, r() * h, 20 + r() * 80, r() * Math.PI * 2, 0.4, "210,208,202", 0.28);
};

/** Calacatta: warm white stone with bold grey veins, touched with gold. */
const marbleLight: Draw = (g, r, w, h) => {
  g.fillStyle = "#f3f0ea";
  g.fillRect(0, 0, w, h);
  clouds(g, r, w, h, ["200,194,186", "255,255,255", "214,206,192"], 60);
  for (let i = 0; i < 5; i++) {
    const x0 = r() * w * 0.2;
    const y0 = r() * h;
    const angle = -0.5 + (r() - 0.5) * 0.7;
    vein(g, r, x0, y0, w * 1.4, angle, 1.6 + r() * 2.4, "118,112,104", 0.62);
    if (i % 2 === 0) vein(g, r, x0 + 6, y0 + 4, w * 1.2, angle, 0.8, "196,160,92", 0.55);
  }
  for (let i = 0; i < 40; i++) vein(g, r, r() * w, r() * h, 20 + r() * 90, r() * Math.PI * 2, 0.45, "150,144,136", 0.3);
};

/** Terrazzo: marble chips in black, grey, white, rust and a little of the brand yellow, set in a pale ground. */
const terrazzo: Draw = (g, r, w, h) => {
  g.fillStyle = "#e3dccf";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = `rgba(120,110,95,${r() * 0.12})`;
    g.fillRect(r() * w, r() * h, 1.5, 1.5);
  }
  const chips: [string, number][] = [
    ["#1a1a1c", 0.3],
    ["#8f877b", 0.24],
    ["#faf7f0", 0.2],
    ["#ffcb04", 0.1],
    ["#b0623a", 0.1],
    ["#7d8a6a", 0.06],
  ];
  const pick = () => {
    let t = r();
    for (const [c, p] of chips) {
      if ((t -= p) <= 0) return c;
    }
    return chips[0][0];
  };
  for (let i = 0; i < 700; i++) {
    const size = 2 + r() ** 2.2 * 22;
    const x = r() * w;
    const y = r() * h;
    const sides = 5 + Math.floor(r() * 3);
    const turn = r() * Math.PI;
    g.fillStyle = pick();
    g.beginPath();
    for (let k = 0; k < sides; k++) {
      const a = turn + (k / sides) * Math.PI * 2;
      const rad = size * (0.55 + r() * 0.45);
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad * (0.7 + r() * 0.3);
      if (k) g.lineTo(px, py);
      else g.moveTo(px, py);
    }
    g.closePath();
    g.fill();
  }
};

/**
 * Rattan cane webbing: pairs of vertical and horizontal strands with two
 * diagonals through every crossing, leaving octagonal holes. `holes` draws the
 * alpha map (white strands, black holes); otherwise the honey-coloured strands.
 */
function cane(holes: boolean): Draw {
  return (g, r, w, h) => {
    const cell = w / 8;
    g.fillStyle = holes ? "#000" : "#7a5a33";
    g.fillRect(0, 0, w, h);
    const strand = (x0: number, y0: number, x1: number, y1: number, width: number) => {
      g.lineWidth = width;
      g.strokeStyle = holes ? "#fff" : `rgb(${196 + r() * 20},${152 + r() * 18},${96 + r() * 16})`;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
    };
    for (let k = 0; k <= 8; k++) {
      const at = k * cell;
      for (const off of [-cell * 0.09, cell * 0.09]) {
        strand(at + off, 0, at + off, h, cell * 0.12);
        strand(0, at + off, w, at + off, cell * 0.12);
      }
    }
    for (let k = -8; k <= 16; k++) {
      strand(k * cell, 0, k * cell + h, h, cell * 0.13);
      strand(k * cell, 0, k * cell - h, h, cell * 0.13);
    }
  };
}

/**
 * White in the middle fading to black, on an opaque canvas: an additive glow as
 * a colour map, a soft shadow as an alpha map (which reads colour, not alpha).
 */
const radial: Draw = (g, _r, w, h) => {
  g.fillStyle = "#000";
  g.fillRect(0, 0, w, h);
  // a near-Gaussian falloff, so no edge shows on dark or light backgrounds
  const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  [
    [0, 255],
    [0.2, 222],
    [0.4, 150],
    [0.6, 78],
    [0.8, 26],
    [1, 0],
  ].forEach(([at, v]) => grad.addColorStop(at, `rgb(${v},${v},${v})`));
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
};

const ROOM = {
  walnut: { w: 512, h: 512, seed: 11, draw: walnut },
  floor: { w: 1024, h: 1024, seed: 21, draw: tiles },
  slab: { w: 512, h: 512, seed: 23, draw: slab },
  linen: { w: 256, h: 256, seed: 31, draw: linen },
  rug: { w: 512, h: 512, seed: 37, draw: rug },
  plaster: { w: 256, h: 256, seed: 41, draw: plaster },
  lattice: { w: 512, h: 512, seed: 43, draw: lattice },
  art: { w: 640, h: 460, seed: 47, draw: art },
  marbleDark: { w: 512, h: 512, seed: 53, draw: marbleDark },
  marbleLight: { w: 512, h: 512, seed: 59, draw: marbleLight },
  glow: { w: 128, h: 128, seed: 1, draw: radial },
} satisfies Record<string, Recipe>;

const BOARD = {
  marbleDark: { w: 1024, h: 1024, seed: 61, draw: marbleDark },
  marbleLight: { w: 1024, h: 1024, seed: 67, draw: marbleLight },
  walnut: { w: 512, h: 512, seed: 71, draw: walnut },
  terrazzo: { w: 1024, h: 1024, seed: 73, draw: terrazzo },
  linen: { w: 256, h: 256, seed: 79, draw: linen },
  travertine: { w: 512, h: 512, seed: 83, draw: slab },
  cane: { w: 512, h: 512, seed: 89, draw: cane(false) },
  caneHoles: { w: 512, h: 512, seed: 89, draw: cane(true) },
  glow: { w: 256, h: 256, seed: 1, draw: radial },
} satisfies Record<string, Recipe>;

const SETS = { room: ROOM, board: BOARD } as const;

/**
 * Paint a scene's surfaces ahead of time, one per idle moment, so the scene is
 * quick to mount and scrolling never stalls on it. Returns a cancel function.
 */
export function prepareTextures(set: keyof typeof SETS) {
  const queue = Object.entries(SETS[set]).filter(([key]) => !painted.has(`${set}:${key}`));
  let cancel = () => {};
  const next = () => {
    const job = queue.shift();
    if (!job) return;
    cancel = whenIdle(() => {
      paintOnce(`${set}:${job[0]}`, job[1]);
      next();
    }, 800);
  };
  next();
  return () => cancel();
}

const surface = (set: keyof typeof SETS, key: string) =>
  paintOnce(`${set}:${key}`, (SETS[set] as Record<string, Recipe>)[key]);

/** Every surface in the room (three/Room.tsx). */
export function createTextures() {
  const room = (key: keyof typeof ROOM) => surface("room", key);
  return {
    walnut: texture(room("walnut")),
    floor: texture(room("floor"), { repeat: [2.5, 1.875] }),
    slab: texture(room("slab")),
    linen: texture(room("linen"), { repeat: [2, 2] }),
    rug: texture(room("rug")),
    plaster: texture(room("plaster"), { repeat: [2, 2] }),
    lattice: texture(room("lattice"), { color: false }),
    art: texture(room("art")),
    marbleDark: texture(room("marbleDark")),
    marbleLight: texture(room("marbleLight")),
    glow: texture(room("glow"), { color: false }),
  };
}

/** The samples on the moodboard (three/Materials.tsx). */
export function createBoardTextures() {
  const board = (key: keyof typeof BOARD) => surface("board", key);
  return {
    marbleDark: texture(board("marbleDark")),
    marbleLight: texture(board("marbleLight")),
    walnut: texture(board("walnut")),
    terrazzo: texture(board("terrazzo")),
    linen: texture(board("linen"), { repeat: [3, 3] }),
    travertine: texture(board("travertine")),
    cane: texture(board("cane"), { repeat: [1.5, 1.5] }),
    caneHoles: texture(board("caneHoles"), { color: false, repeat: [1.5, 1.5] }),
    glow: texture(board("glow"), { color: false }),
  };
}

export type RoomTextures = ReturnType<typeof createTextures>;

/** Dimension labels for the plan, set in the page's own typeface. */
export function labelTexture(text: string, color = "#0b0b0c") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.font = `600 58px ${getComputedStyle(document.body).fontFamily}`;
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 256, 64);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
