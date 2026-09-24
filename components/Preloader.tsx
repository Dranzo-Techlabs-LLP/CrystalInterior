"use client";

import { useRef, useState } from "react";
import { hero } from "@/data/home";
import { site } from "@/data/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { markIntroDone } from "@/lib/intro";
import { setScrollLocked } from "@/lib/scroll";
import { Logo } from "./Logo";

const SEEN = "ci:intro";

/** Resolves once the fonts and the film's first frame are ready, or after `ms`, whichever comes first. */
function pageReady(ms: number) {
  const poster = new Image();
  poster.src = `${hero.film.base}/poster-${window.matchMedia("(max-aspect-ratio: 4/5)").matches ? "mobile" : "desktop"}.jpg`;
  const ready = Promise.all([document.fonts?.ready, poster.decode().catch(() => undefined)]);
  return Promise.race([ready, new Promise((resolve) => setTimeout(resolve, ms))]);
}

/**
 * The first moment of a visit: the logo builds itself (bars rise, the name
 * sets, the double rule draws, INTERIO spells out) while the film's first
 * frame and the fonts load, then a black and a yellow curtain lift off the
 * page. Once per visit; never with reduced motion or without JavaScript.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useGSAP(
    () => {
      const html = document.documentElement;
      if (html.classList.contains("intro-seen") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        markIntroDone(false);
        setGone(true);
        return;
      }

      setScrollLocked(true);
      const count = root.current!.querySelector<HTMLElement>("[data-count]")!;
      const shown = { v: 0 };
      const ready = pageReady(3500);
      const finish = () => {
        try {
          sessionStorage.setItem(SEEN, "1");
        } catch {}
        setScrollLocked(false);
        setGone(true);
      };

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from("[data-logo='bar']", { scaleY: 0, transformOrigin: "50% 100%", duration: 0.95, stagger: { each: 0.04, from: "edges" } }, 0)
        .from("[data-logo='letter']", { y: 70, opacity: 0, duration: 0.8, stagger: 0.05 }, 0.15)
        .from("[data-logo='rule']", { scaleX: 0, transformOrigin: "50% 50%", duration: 0.85, ease: "expo.inOut", stagger: 0.1 }, 0.35)
        .from("[data-logo='sub']", { opacity: 0, y: 14, duration: 0.5, stagger: 0.04 }, 0.65)
        .to(
          shown,
          {
            v: 100,
            duration: 1.45,
            ease: "power2.inOut",
            onUpdate: () => {
              count.textContent = String(Math.round(shown.v)).padStart(3, "0");
            },
          },
          0,
        )
        // hold on the finished logo until the page behind it is ready
        .addPause(1.5, () => {
          ready.then(() => tl.play());
        })
        .to("[data-pre-logo]", { y: -40, opacity: 0, duration: 0.45, ease: "power3.in" }, 1.55)
        .to("[data-pre-meta]", { opacity: 0, duration: 0.25, ease: "power1.in" }, 1.55)
        .to("[data-pre-panel='ink']", { yPercent: -100, duration: 0.85, ease: "expo.inOut" }, 1.85)
        .to("[data-pre-panel='yellow']", { yPercent: -100, duration: 0.85, ease: "expo.inOut" }, 1.95)
        // the hero's headline rises as the curtain lifts
        .add(() => markIntroDone(true), 2.2)
        .add(finish);

      return () => {
        setScrollLocked(false);
      };
    },
    { scope: root },
  );

  if (gone) return null;

  return (
    <div ref={root} className="preloader" aria-hidden data-lenis-prevent>
      <div className="preloader__panel preloader__panel--yellow" data-pre-panel="yellow" />
      <div className="preloader__panel preloader__panel--ink" data-pre-panel="ink" />
      <div className="preloader__logo" data-pre-logo>
        <Logo decorative />
      </div>
      <div className="preloader__meta" data-pre-meta>
        <span>Interior design studio</span>
        <span className="preloader__count">
          <span data-count>000</span>
        </span>
        <span>{site.contact.address.split(", ").pop()}</span>
      </div>
    </div>
  );
}
