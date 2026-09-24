"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/** A hairline of brand yellow across the top of the window: how far down the page you are. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } },
    );
  });

  return (
    <div className="progress" aria-hidden>
      <div ref={bar} className="progress__bar" />
    </div>
  );
}
