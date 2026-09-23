"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { intro } from "@/data/home";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { hasWebGL, whenIdle } from "@/lib/webgl";
import { CrystalMark, Illustration } from "./Icons";
import { gem } from "./three/store";

const Crystal = dynamic(() => import("./three/Crystal"), { ssr: false });

const noSubscription = () => () => {};

/** The cream sheet that slides up over the last frame of the opening film. */
export function Intro() {
  const section = useRef<HTMLElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const webgl = useSyncExternalStore(noSubscription, hasWebGL, () => true);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);

  // The logo's crystal comes alive in 3D once the page is idle (a still mark otherwise).
  useEffect(() => {
    if (reduced || !webgl) return;
    return whenIdle(() => setLive(true), 2500);
  }, [reduced, webgl]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // a turn and a half as the sheet passes through the screen
        gsap.to(gem, {
          turn: Math.PI * 1.5,
          ease: "none",
          onUpdate: () => gem.invalidate?.(),
          scrollTrigger: { trigger: section.current, start: "top bottom", end: "bottom top", scrub: 0.8 },
        });
      });
      mm.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
        const render = () => gem.invalidate?.();
        const tiltX = gsap.quickTo(gem, "tiltX", { duration: 0.9, ease: "power3.out", onUpdate: render });
        const tiltY = gsap.quickTo(gem, "tiltY", { duration: 0.9, ease: "power3.out", onUpdate: render });
        const lean = (e: PointerEvent) => {
          const r = holder.current!.getBoundingClientRect();
          tiltY(gsap.utils.clamp(-0.6, 0.6, ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 1.4));
          tiltX(gsap.utils.clamp(-0.4, 0.4, ((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 0.9));
        };
        // only listen while the intro is on screen
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
        };
      });
    },
    { scope: section },
  );

  return (
    <section ref={section} id="intro" className="sheet intro" aria-labelledby="intro-title">
      <div ref={holder} className="intro__gem" data-3d={ready ? "ready" : "loading"} aria-hidden>
        <CrystalMark className="intro__gem-mark" />
        {live && (
          <div className="intro__gem-canvas">
            <Crystal onReady={() => setReady(true)} />
          </div>
        )}
      </div>
      <p className="eyebrow" data-reveal>
        {intro.eyebrow}
      </p>
      <h2 id="intro-title" className="intro__title" data-reveal>
        {intro.title}
      </h2>
      <p className="intro__lead" data-reveal-text>
        {intro.lead}
      </p>
      <ul className="intro__highlights">
        {intro.highlights.map((h) => (
          <li key={h.label} className="intro__highlight" data-reveal>
            <Illustration name={h.icon} className="intro__icon" />
            <span>{h.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
