"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { scrollToId } from "@/lib/scroll";
import { hero } from "@/data/home";
import { Icon } from "./Icons";

type Manifest = Record<"desktop" | "mobile", { count: number; width: number; height: number }>;

const frameUrl = (set: string, i: number) => `${hero.film.base}/${set}/f${String(i).padStart(3, "0")}.webp`;

/** Load order: first + last, then every 16th, 8th, 4th, 2nd, then the rest. */
function loadOrder(count: number) {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const step of [count, 16, 8, 4, 2, 1]) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
    if (!seen.has(count - 1)) {
      seen.add(count - 1);
      order.push(count - 1);
    }
  }
  return order;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  const dw = ir > cr ? h * ir : w;
  const dh = ir > cr ? h : w / ir;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/**
 * The opening: a full-screen film, scrubbed by scroll. Pinned while scrolling
 * moves it from the first frame to the last; it holds when scrolling stops,
 * reverses when scrolling back, and hands over to the page after the final
 * frame. No autoplay, no looping — the visitor's scroll is the playhead.
 */
export function HeroFilm() {
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      const stage = stageRef.current;
      const canvas = canvasRef.current;
      if (!section || !stage || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          portrait: "(max-aspect-ratio: 4/5)",
        },
        (context) => {
          const { motion, portrait } = context.conditions as { motion: boolean; portrait: boolean };
          if (!motion) return;

          const set = portrait ? "mobile" : "desktop";
          const frames: HTMLImageElement[] = [];
          let count = 0;
          let wanted = 0;
          let drawn = -1;
          let alive = true;

          const fit = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(canvas.clientWidth * dpr);
            canvas.height = Math.round(canvas.clientHeight * dpr);
            drawn = -1;
            draw(wanted);
          };

          // Draw the requested frame, or the nearest one that has loaded.
          const draw = (i: number) => {
            wanted = i;
            if (!count) return;
            let pick = -1;
            for (let d = 0; d < count; d++) {
              if (frames[i - d]) {
                pick = i - d;
                break;
              }
              if (frames[i + d]) {
                pick = i + d;
                break;
              }
            }
            if (pick < 0 || pick === drawn) return;
            drawn = pick;
            drawCover(ctx, frames[pick], canvas.width, canvas.height);
            canvas.dataset.ready = "true";
          };

          const load = async (manifest: Manifest) => {
            count = manifest[set].count;
            const queue = loadOrder(count);
            const worker = async () => {
              while (alive && queue.length) {
                const i = queue.shift()!;
                const img = new Image();
                img.decoding = "async";
                img.src = frameUrl(set, i);
                try {
                  await img.decode();
                } catch {
                  continue;
                }
                if (!alive) return;
                frames[i] = img;
                if (Math.abs(i - wanted) <= 16) draw(wanted);
              }
            };
            await Promise.all(Array.from({ length: 6 }, worker));
          };

          fetch(`${hero.film.base}/manifest.json`)
            .then((r) => r.json())
            .then((m: Manifest) => {
              if (!alive) return;
              count = m[set].count;
              wanted = frameAt();
              fit();
              return load(m);
            })
            .catch(() => {});

          // Normalised playhead: the frame count arrives with the manifest.
          // The runway is laid out in CSS (the stage is sticky), so the film
          // runs for exactly as long as the stage stays on screen.
          const playhead = { p: 0 };
          const frameAt = () => Math.round(playhead.p * Math.max(0, count - 1));
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${Math.max(1, section.offsetHeight - stage.offsetHeight)}`,
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          });
          tl.to(playhead, { p: 1, duration: 1, onUpdate: () => draw(frameAt()) }, 0);
          tl.to("[data-hero-copy]", { opacity: 0, y: -48, duration: 0.1, ease: "power1.in" }, 0.01);
          tl.to("[data-hero-bar]", { opacity: 0, duration: 0.06 }, 0.9);

          const ro = new ResizeObserver(fit);
          ro.observe(canvas);

          return () => {
            alive = false;
            ro.disconnect();
            delete canvas.dataset.ready;
          };
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="hero" aria-label="Opening film: walking into a home">
      <div ref={stageRef} className="hero__stage">
        <picture className="hero__poster">
          <source media="(max-aspect-ratio: 4/5)" srcSet={`${hero.film.base}/poster-mobile.jpg`} />
          <img
            src={`${hero.film.base}/poster-desktop.jpg`}
            alt="A white stone villa at dusk, its windows glowing, with a marble walkway to the front door"
            fetchPriority="high"
          />
        </picture>
        <canvas ref={canvasRef} className="hero__canvas" aria-hidden />
        <div className="hero__shade" aria-hidden />

        <div className="hero__copy" data-hero-copy>
          <p className="eyebrow eyebrow--light">{hero.eyebrow}</p>
          <h1 className="hero__title">
            {hero.title[0]} <em>{hero.title[1]}</em>
          </h1>
          <p className="hero__lead">{hero.lead}</p>
          <div className="hero__actions">
            <button type="button" className="btn btn--light" onClick={() => scrollToId(hero.cta.target)}>
              {hero.cta.label}
              <Icon name="arrowUpRight" className="btn__icon" />
            </button>
          </div>
        </div>

        <div className="hero__bar" data-hero-bar>
          <span className="hero__cue">
            <span className="hero__cue-ring" aria-hidden>
              <Icon name="arrowDown" />
            </span>
            {hero.cue}
          </span>
          <button type="button" className="hero__explore" onClick={() => scrollToId(hero.explore.target)}>
            {hero.explore.label}
            <Icon name="arrowUpRight" className="btn__icon" />
          </button>
        </div>
      </div>
    </section>
  );
}
