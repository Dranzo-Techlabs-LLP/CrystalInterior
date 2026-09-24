"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { materials } from "@/data/home";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { scrollToId } from "@/lib/scroll";
import { hasWebGL, whenIdle } from "@/lib/webgl";
import { Icon } from "./Icons";
import { DecoBars } from "./Logo";
import { afterScene, board, landing, sceneReady } from "./three/store";

const loadBoard = () => import("./three/Materials");
const Board = dynamic(loadBoard, { ssr: false });

const noSubscription = () => () => {};

/** The last sample that has landed at progress p (-1 while they are all still in the air). */
function landedAt(p: number) {
  let n = -1;
  materials.items.forEach((_, i) => {
    if (p >= landing(i).to - 0.03) n = i;
  });
  return n;
}

/**
 * The palette: material samples float in the dark, then settle one by one
 * into a moodboard on the studio table as you scroll, each named as it lands.
 * With reduced motion (or without WebGL) it is a still of the finished board
 * beside the list.
 */
export function Materials() {
  const section = useRef<HTMLElement>(null);
  const runway = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const webgl = useSyncExternalStore(noSubscription, hasWebGL, () => true);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);

  // As soon as the page settles, fetch the 3D code and paint its surfaces in idle
  // moments, then set the scene up offscreen once the crystal is drawing; if the
  // visitor heads here first, it is set up as soon as they are three screens away.
  useEffect(() => {
    if (reduced || !webgl || !section.current) return;
    let cancelPaint: (() => void) | undefined;
    let cancelMount: (() => void) | undefined;
    let alive = true;
    const mount = () => {
      if (cancelMount) return;
      cancelMount = whenIdle(() => setLive(true), 300);
    };
    const cancelPrefetch = whenIdle(() => {
      loadBoard().then((m) => {
        if (alive) cancelPaint = m.prepare();
      });
    }, 1200);
    const stopWaiting = afterScene("gem", mount);
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        mount();
      },
      { rootMargin: "300% 0px" },
    );
    io.observe(section.current);
    return () => {
      alive = false;
      cancelPrefetch();
      cancelPaint?.();
      cancelMount?.();
      stopWaiting();
      io.disconnect();
    };
  }, [reduced, webgl]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const stageEl = stage.current!;
        const runwayEl = runway.current!;
        const items = gsap.utils.toArray<HTMLElement>("[data-mat]", stageEl);
        const count = stageEl.querySelector<HTMLElement>("[data-mat-count]")!;
        let shown = -2;
        const mark = (p: number) => {
          const n = landedAt(p);
          if (n === shown) return;
          shown = n;
          items.forEach((el, i) => {
            el.toggleAttribute("data-landed", i <= n);
            el.toggleAttribute("data-current", i === n);
          });
          count.textContent = String(Math.max(0, n + 1)).padStart(2, "0");
        };
        mark(0);

        // the samples float (and the scene keeps drawing) only while the section is on screen
        const watch = ScrollTrigger.create({
          trigger: section.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            board.active = self.isActive;
            board.invalidate?.();
          },
        });

        // The runway is laid out in CSS; the samples land while the stage is held on screen.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: runwayEl,
            start: "top top",
            end: () => `+=${Math.max(1, runwayEl.offsetHeight - stageEl.offsetHeight)}`,
            scrub: 0.35,
            invalidateOnRefresh: true,
          },
        });
        tl.to(
          board,
          {
            p: 1,
            duration: 1,
            onUpdate: () => {
              board.invalidate?.();
              mark(board.p);
            },
          },
          0,
        );
        tl.fromTo("[data-mats-cta]", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.8);
        return () => {
          watch.kill();
          board.p = 0;
          board.active = false;
        };
      });

      // on desktop the board leans a little toward the mouse
      mm.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
        const render = () => board.invalidate?.();
        const leanX = gsap.quickTo(board, "leanX", { duration: 1.2, ease: "power3.out", onUpdate: render });
        const leanY = gsap.quickTo(board, "leanY", { duration: 1.2, ease: "power3.out", onUpdate: render });
        const lean = (e: PointerEvent) => {
          leanX(e.clientX / window.innerWidth - 0.5);
          leanY(e.clientY / window.innerHeight - 0.5);
        };
        const watch = ScrollTrigger.create({
          trigger: section.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) =>
            self.isActive ? window.addEventListener("pointermove", lean) : window.removeEventListener("pointermove", lean),
        });
        return () => {
          watch.kill();
          window.removeEventListener("pointermove", lean);
          board.leanX = board.leanY = 0;
        };
      });
    },
    { scope: section },
  );

  return (
    <section ref={section} id="materials" className="section mats theme-dark" aria-labelledby="materials-title">
      <div ref={runway} className="mats__runway">
        <div ref={stage} className="mats__stage" data-3d={!webgl ? "off" : ready ? "ready" : "loading"}>
          <div className="mats__view">
            <picture className="mats__ph">
              <source media="(max-width: 760px) and (orientation: portrait)" srcSet={materials.placeholder.tall} />
              <img src={materials.placeholder.wide} alt="" decoding="async" />
            </picture>
            <img
              className="mats__still"
              src={materials.still.src}
              width={materials.still.width}
              height={materials.still.height}
              alt={materials.still.alt}
              loading="lazy"
              decoding="async"
            />
            {live && (
              <div className="mats__canvas" aria-hidden>
                <Board
                  onReady={() => {
                    setReady(true);
                    sceneReady("board");
                  }}
                />
              </div>
            )}
          </div>

          <div className="mats__head">
            <p className="eyebrow">
              <DecoBars />
              {materials.eyebrow}
            </p>
            <h2 id="materials-title" className="title" data-split>
              {materials.title[0]} <em>{materials.title[1]}</em>
            </h2>
            <p className="mats__lead">{materials.lead}</p>
          </div>

          <div className="mats__side">
            <p className="mats__count" aria-hidden>
              <span data-mat-count>00</span> / {String(materials.items.length).padStart(2, "0")}
            </p>
            <p className="mats__hint" aria-hidden>
              Scroll to set the table
            </p>
            <ol className="mats__list">
              {materials.items.map((m, i) => (
                <li key={m.key} className="mats__item" data-mat>
                  <span className="mats__swatch" style={{ "--tone": m.tone } as React.CSSProperties} aria-hidden />
                  <span className="mats__num" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mats__name">{m.name}</span>
                  <span className="mats__kind">{m.kind}</span>
                </li>
              ))}
            </ol>
            <button type="button" className="btn btn--primary mats__cta" data-mats-cta onClick={() => scrollToId(materials.cta.target)}>
              {materials.cta.label}
              <span className="btn__orb" aria-hidden>
                <Icon name="arrowUpRight" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
