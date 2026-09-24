"use client";

import { Fragment, useRef } from "react";
import { marquee } from "@/data/home";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DecoBars } from "./Logo";

/**
 * Two bands crossing like tape, one yellow and one black, carrying the rooms
 * and the homes the studio designs. They drift on their own, speed up with
 * the scroll and turn around when you scroll back. Still for reduced motion.
 */
export function Marquee() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tracks = gsap.utils.toArray<HTMLElement>("[data-track]");
        // each track holds two identical halves, so sliding by half of it loops without a seam
        const loops = tracks.map((track, i) => {
          const loop = gsap.fromTo(
            track,
            { xPercent: i % 2 ? -50 : 0 },
            { xPercent: i % 2 ? 0 : -50, duration: 42 + i * 8, ease: "none", repeat: -1 },
          );
          // start far into the loop, so playing it backwards never reaches the start
          loop.totalTime(loop.duration() * 50);
          return loop;
        });

        let direction = 1;
        const settle = () => loops.forEach((l) => gsap.to(l, { timeScale: direction, duration: 1.2, ease: "power2.out", overwrite: true }));
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => loops.forEach((l) => (self.isActive ? l.resume() : l.pause())),
          onUpdate: (self) => {
            direction = self.direction;
            const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 6);
            loops.forEach((l) =>
              gsap.to(l, { timeScale: direction * boost, duration: 0.25, ease: "power1.out", overwrite: true, onComplete: settle }),
            );
          },
        });
        if (!st.isActive) loops.forEach((l) => l.pause());
        return () => st.kill();
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="marquee" aria-label={marquee.label}>
      {marquee.rows.map((row, r) => (
        <div key={r} className={`marquee__band marquee__band--${r ? "ink" : "yellow"}`}>
          <div className="marquee__track" data-track>
            {[0, 1].map((half) => (
              <ul key={half} className="marquee__list" aria-hidden={half === 1 ? true : undefined}>
                {/* each half repeats the row, so it is always wider than the screen */}
                {[0, 1].map((rep) => (
                  <Fragment key={rep}>
                    {row.map((word) => (
                      <li key={`${rep}-${word}`} className="marquee__item" aria-hidden={rep === 1 ? true : undefined}>
                        <span className="marquee__word">{word}</span>
                        <DecoBars className="marquee__mark" />
                      </li>
                    ))}
                  </Fragment>
                ))}
              </ul>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
