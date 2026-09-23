"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { approach } from "@/data/home";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { gsap, useGSAP } from "@/lib/gsap";
import { scrollToId } from "@/lib/scroll";
import { hasWebGL, whenIdle } from "@/lib/webgl";
import { Icon } from "./Icons";
import { ROOM_STEPS, room } from "./three/store";

const loadRoom = () => import("./three/Room");
const Room = dynamic(loadRoom, { ssr: false });

const noSubscription = () => () => {};

/** The step whose caption shows at progress p (switching a touch early, so the words lead the action). */
function stepAt(p: number) {
  let i = 0;
  while (i < ROOM_STEPS.length - 1 && p >= ROOM_STEPS[i + 1] - 0.02) i++;
  return i;
}

/**
 * The studio's approach, told by a room that builds itself in 3D as you scroll:
 * sketch, walls and joinery, materials, light, and the finished home. With
 * reduced motion (or without WebGL) it becomes a still of the finished room and
 * the five steps as a list.
 */
export function Approach() {
  const section = useRef<HTMLElement>(null);
  const runway = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const webgl = useSyncExternalStore(noSubscription, hasWebGL, () => true);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);

  // Fetch the 3D code once the page is idle, and mount the room shortly before it's reached.
  useEffect(() => {
    if (reduced || !webgl || !section.current) return;
    const cancelPrefetch = whenIdle(() => void loadRoom(), 4000);
    let cancelMount: (() => void) | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        cancelMount = whenIdle(() => setLive(true), 600);
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(section.current);
    return () => {
      cancelPrefetch();
      cancelMount?.();
      io.disconnect();
    };
  }, [reduced, webgl]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const stageEl = stage.current!;
        const runwayEl = runway.current!;
        const steps = gsap.utils.toArray<HTMLElement>("[data-step]", stageEl);
        const ticks = gsap.utils.toArray<HTMLElement>("[data-tick]", stageEl);
        let current = -1;
        const show = (i: number) => {
          if (i === current) return;
          current = i;
          steps.forEach((el, j) => el.toggleAttribute("data-current", j === i));
          ticks.forEach((el, j) => el.toggleAttribute("data-current", j <= i));
        };
        show(0);

        // The runway is laid out in CSS; the room plays while the stage is held on screen.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: runwayEl,
            start: "top top",
            end: () => `+=${Math.max(1, runwayEl.offsetHeight - stageEl.offsetHeight)}`,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        tl.to(
          room,
          {
            p: 1,
            duration: 1,
            onUpdate: () => {
              room.invalidate?.();
              show(stepAt(room.p));
            },
          },
          0,
        );
        // Evening falls on the whole section as the lamps come on.
        tl.to(
          section.current,
          {
            "--build-bg": "#1b2638",
            "--build-ink": "#fbf8f3",
            "--build-muted": "rgba(251, 248, 243, 0.72)",
            "--build-accent": "#e9b872",
            duration: 0.14,
            ease: "power1.inOut",
          },
          0.62,
        );
        tl.fromTo("[data-build-cta]", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.88);
        return () => {
          room.p = 0;
        };
      });
    },
    { scope: section },
  );

  return (
    <section ref={section} id="approach" className="section approach" aria-labelledby="approach-title">
      <div ref={runway} className="build">
        <div ref={stage} className="build__stage" data-3d={!webgl ? "off" : ready ? "ready" : "loading"}>
          <div className="build__view">
            <img
              className="build__still"
              src={approach.still.src}
              width={approach.still.width}
              height={approach.still.height}
              alt={approach.still.alt}
              loading="lazy"
              decoding="async"
            />
            {live && (
              <div className="build__canvas" aria-hidden>
                <Room onReady={() => setReady(true)} />
              </div>
            )}
          </div>

          <div className="build__head">
            <p className="eyebrow">{approach.eyebrow}</p>
            <h2 id="approach-title" className="title">
              {approach.title[0]} <em>{approach.title[1]}</em>
            </h2>
          </div>

          <div className="build__copy">
            <ol className="build__steps">
              {approach.steps.map((step, i) => (
                <li key={step.key} className="build__step" data-step>
                  <p className="build__kicker">
                    <span className="build__num">{String(i + 1).padStart(2, "0")}</span>
                    {step.kicker}
                  </p>
                  <h3 className="build__title">{step.title}</h3>
                  <p className="build__body">{step.body}</p>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="btn btn--red build__cta"
              data-build-cta
              onClick={() => scrollToId(approach.cta.target)}
            >
              {approach.cta.label}
              <Icon name="arrowUpRight" className="btn__icon" />
            </button>
          </div>

          <ol className="build__rail" aria-hidden>
            {approach.steps.map((step) => (
              <li key={step.key} className="build__tick" data-tick>
                {step.kicker}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
