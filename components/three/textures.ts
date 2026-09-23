import * as THREE from "three";

/**
 * Every surface texture for the room, drawn in code on 2D canvases: nothing to
 * download, and the same seeded grain on every visit.
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

const rug: Draw = (g, r, w, h) => {
  g.fillStyle = "#d9cab3";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(120,95,70,${r() * 0.08})` : `rgba(255,250,240,${r() * 0.1})`;
    g.fillRect(r() * w, r() * h, 2, 1);
  }
  g.strokeStyle = "#b39a78";
  g.lineWidth = w * 0.018;
  g.strokeRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88);
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

/** An abstract canvas for the wall: a walnut arch, a low ochre sun, a sand horizon. */
const art: Draw = (g, r, w, h) => {
  g.fillStyle = "#efe5d3";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#cdb897";
  g.fillRect(0, h * 0.74, w, h * 0.26);
  const sun = g.createRadialGradient(w * 0.64, h * 0.56, 4, w * 0.64, h * 0.56, h * 0.28);
  sun.addColorStop(0, "rgba(206,132,66,1)");
  sun.addColorStop(0.82, "rgba(206,132,66,0.95)");
  sun.addColorStop(1, "rgba(206,132,66,0)");
  g.fillStyle = sun;
  g.beginPath();
  g.arc(w * 0.64, h * 0.56, h * 0.28, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#6b4431";
  g.beginPath();
  g.moveTo(w * 0.2, h);
  g.lineTo(w * 0.2, h * 0.5);
  g.arc(w * 0.34, h * 0.5, w * 0.14, Math.PI, 0);
  g.lineTo(w * 0.48, h);
  g.closePath();
  g.fill();
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(90,70,50,${r() * 0.05})`;
    g.fillRect(r() * w, r() * h, 1.5, 1.5);
  }
};

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

export function createTextures() {
  return {
    walnut: texture(paint(512, 512, 11, walnut)),
    floor: texture(paint(1024, 1024, 21, tiles), { repeat: [2.5, 1.875] }),
    slab: texture(paint(512, 512, 23, slab)),
    linen: texture(paint(256, 256, 31, linen), { repeat: [2, 2] }),
    rug: texture(paint(512, 512, 37, rug)),
    plaster: texture(paint(256, 256, 41, plaster), { repeat: [2, 2] }),
    lattice: texture(paint(512, 512, 43, lattice), { color: false }),
    art: texture(paint(640, 460, 47, art)),
    glow: texture(paint(128, 128, 1, radial), { color: false }),
  };
}

export type RoomTextures = ReturnType<typeof createTextures>;

/** Dimension labels for the plan, set in the page's own typeface. */
export function labelTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.font = `600 58px ${getComputedStyle(document.body).fontFamily}`;
  g.fillStyle = "#7a5337";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 256, 64);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
