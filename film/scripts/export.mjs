/**
 * Renders every website film and exports it where the site expects it.
 *
 *   npm run export            render + convert everything
 *   npm run export -- --skip-render   only re-convert existing renders
 *
 * Output (in ../public/film):
 *   walk-in/desktop/f000.webp …   scroll-scrubbed opening, 16:9
 *   walk-in/mobile/f000.webp …    scroll-scrubbed opening, 9:16
 *   walk-in/manifest.json         frame counts + sizes for the player
 *   walk-in/poster-*.jpg          first frame, shown before frames load
 *   morning.mp4 / morning.jpg     ambient loop beside the reviews
 *
 * To use generated footage instead (e.g. a Higgsfield clip), extract its frames
 * into out/<name> with the same f000.jpeg naming and run with --skip-render.
 */
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const out = join(root, "out");
const site = join(root, "..", "public", "film");
const skipRender = process.argv.includes("--skip-render");

const SEQUENCES = [
  { id: "WalkIn", dir: "walkin", target: "desktop", quality: 50 },
  { id: "WalkInPortrait", dir: "walkin-portrait", target: "mobile", quality: 56 },
];

const run = (cmd) => execSync(cmd, { cwd: root, stdio: "inherit" });

if (!skipRender) {
  for (const s of SEQUENCES) {
    run(
      `npx remotion render ${s.id} "${join(out, s.dir)}" --sequence --image-format=jpeg ` +
        `--jpeg-quality=90 --image-sequence-pattern="f[frame].[ext]"`,
    );
  }
  mkdirSync(site, { recursive: true });
  run(`npx remotion render Morning "${join(site, "morning.mp4")}" --codec=h264 --crf=27 --muted`);
  run(`npx remotion still Morning "${join(site, "morning.jpg")}" --frame=0 --jpeg-quality=82`);
}

const manifest = {};
for (const s of SEQUENCES) {
  const src = join(out, s.dir);
  const dest = join(site, "walk-in", s.target);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  const frames = readdirSync(src).filter((f) => f.endsWith(".jpeg")).sort();
  let width = 0;
  let height = 0;
  let bytes = 0;
  for (const [i, file] of frames.entries()) {
    const name = `f${String(i).padStart(3, "0")}.webp`;
    const info = await sharp(join(src, file)).webp({ quality: s.quality, effort: 5 }).toFile(join(dest, name));
    ({ width, height } = info);
    bytes += info.size;
  }
  await sharp(join(src, frames[0])).jpeg({ quality: 80, mozjpeg: true }).toFile(join(site, "walk-in", `poster-${s.target}.jpg`));
  manifest[s.target] = { count: frames.length, width, height };
  console.log(`${s.target}: ${frames.length} frames, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
}
writeFileSync(join(site, "walk-in", "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("manifest:", manifest);
