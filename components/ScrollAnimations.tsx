"use client";

import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";

/**
 * Scroll animations for everything after the opening film:
 *  - [data-reveal-text]: words brighten one by one as the text scrolls through
 *    the viewport (scrubbed, so the reading pace follows the scroll).
 *  - [data-reveal]: blocks rise gently into place the first time they arrive.
 * Nothing is hidden until JS runs, and reduced-motion visitors see it all still.
 */
export function ScrollAnimations() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const splits = gsap.utils.toArray<HTMLElement>("[data-reveal-text]").map((el) => {
        const split = SplitText.create(el, { type: "words" });
        gsap.fromTo(
          split.words,
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 88%", end: "bottom 52%", scrub: 0.6 },
          },
        );
        return split;
      });

      gsap.set("[data-reveal]", { opacity: 0, y: 28 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.07 }),
      });

      return () => splits.forEach((s) => s.revert());
    });
  });

  return null;
}
