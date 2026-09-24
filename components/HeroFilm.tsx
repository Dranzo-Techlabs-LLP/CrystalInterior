"use client";

import { useRef } from "react";
import { hero } from "@/data/home";
import { gsap, useGSAP } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";
import { scrollToId } from "@/lib/scroll";
import { Icon } from "./Icons";
import { DecoBars } from "./Logo";

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

const CHAPTER_ENDS = [...hero.chapters.slice(1).map((c) => c.at), 1];

/**
 * The opening: a full-screen film, scrubbed by scroll. Pinned while scrolling
 * moves it from the first frame to the last; it holds when scrolling stops,
 * reverses when scrolling back, and hands over to the page after the final
 * frame. No autoplay, no looping — the visitor's scroll is the playhead. The
 * three shots are marked as chapters along the bottom.
 */
export function HeroFilm() {
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const section = root.current;
      const stage = stageRef.current;
      const canvas = canvasRef.current;
      if (!section || !stage || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // the headline rises as the intro's curtain lifts (only if the intro played)
      const enter = contextSafe!((played: boolean) => {
        if (!played) return;
        gsap.fromTo(
          "[data-enter-line]",
          { yPercent: 105, opacity: 1 },
          { yPercent: 0, opacity: 1, duration: 1.3, ease: "expo.out", stagger: 0.12 },
        );
        gsap.fromTo(
          "[data-enter]",
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.35 },
        );
      });
      const stopWaiting = onIntroDone(enter);

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

          // Chapters: each fills as its shot plays; the current one is marked.
          const chapters = gsap.utils.toArray<HTMLElement>("[data-chapter]");
          const fills = chapters.map((c) => c.querySelector<HTMLElement>("[data-fill]")!);
          let current = -1;
          const mark = (p: number) => {
            let now = 0;
            hero.chapters.forEach((c, i) => {
              const t = gsap.utils.clamp(0, 1, (p - c.at) / (CHAPTER_ENDS[i] - c.at));
              fills[i].style.transform = `scaleX(${t})`;
              if (p >= c.at) now = i;
            });
            if (now === current) return;
            current = now;
            chapters.forEach((c, i) => c.toggleAttribute("data-current", i === now));
          };
          mark(0);

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
          tl.to(
            playhead,
            {
              p: 1,
              duration: 1,
              onUpdate: () => {
                draw(frameAt());
                mark(playhead.p);
              },
            },
            0,
          );
          tl.to("[data-hero-copy]", { opacity: 0, y: -60, duration: 0.1, ease: "power1.in" }, 0.01);
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

      return () => stopWaiting();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="hero theme-dark" aria-label="Opening film: walking into a home">
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
          <p className="eyebrow" data-enter>
            <DecoBars />
            {hero.eyebrow}
          </p>
          <h1 className="hero__title">
            <span className="hero__line">
              <span data-enter-line>{hero.title[0]}</span>
            </span>
            <span className="hero__line">
              <em data-enter-line>{hero.title[1]}</em>
            </span>
          </h1>
          <p className="hero__lead" data-enter>
            {hero.lead}
          </p>
          <div className="hero__actions" data-enter>
            <button type="button" className="btn btn--primary" onClick={() => scrollToId(hero.cta.target)}>
              {hero.cta.label}
              <span className="btn__orb" aria-hidden>
                <Icon name="arrowUpRight" />
              </span>
            </button>
            <button type="button" className="btn btn--ghost hero__explore" onClick={() => scrollToId(hero.explore.target)}>
              {hero.explore.label}
            </button>
          </div>
        </div>

        <div className="hero__bar" data-hero-bar>
          <span className="hero__cue">
            <span className="hero__cue-line" aria-hidden />
            {hero.cue}
          </span>
          <ol className="hero__chapters" aria-hidden>
            {hero.chapters.map((c, i) => (
              <li key={c.label} className="hero__chapter" data-chapter>
                <span className="hero__chapter-label">
                  <span className="hero__chapter-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="hero__chapter-text">{c.label}</span>
                </span>
                <span className="hero__chapter-track">
                  <span className="hero__chapter-fill" data-fill />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
