"use client";

import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";

/**
 * Scroll animations for everything after the opening film:
 *  - [data-split]: headings rise line by line out of a mask, once.
 *  - [data-reveal-text]: words brighten one by one as the text scrolls through
 *    the viewport (scrubbed, so the reading pace follows the scroll).
 *  - [data-reveal]: blocks rise gently into place the first time they arrive.
 *  - .hl: the highlighter stroke under an accent word draws in.
 *  - [data-parallax]: photos drift slowly inside their frames.
 *  - [data-rise]: the closing section's bars grow up from the floor.
 * Nothing is hidden until JS runs, and reduced-motion visitors see it all still.
 */
export function ScrollAnimations() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const splits = gsap.utils.toArray<HTMLElement>("[data-split]").map((el) =>
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.15,
              ease: "expo.out",
              stagger: 0.1,
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            }),
        }),
      );

      const words = gsap.utils.toArray<HTMLElement>("[data-reveal-text]").map((el) => {
        const split = SplitText.create(el, { type: "words" });
        gsap.fromTo(
          split.words,
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 86%", end: "bottom 50%", scrub: 0.6 },
          },
        );
        return split;
      });

      gsap.set("[data-reveal]", { opacity: 0, y: 28 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 90%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.07 }),
      });

      // the heading is marked (not the word): SplitText may rebuild the word's element on re-split
      document.documentElement.classList.add("hl-armed");
      ScrollTrigger.batch("[data-split]", {
        start: "top 85%",
        once: true,
        onEnter: (batch) => batch.forEach((el) => setTimeout(() => el.classList.add("is-in"), 550)),
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((img) => {
        gsap.fromTo(
          img,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".closing").forEach((closing) => {
        gsap.from(closing.querySelectorAll("[data-rise]"), {
          scaleY: 0,
          transformOrigin: "50% 100%",
          ease: "none",
          stagger: 0.06,
          scrollTrigger: { trigger: closing, start: "top 95%", end: "top 25%", scrub: 0.8 },
        });
      });

      return () => {
        splits.forEach((s) => s.revert());
        words.forEach((s) => s.revert());
        document.documentElement.classList.remove("hl-armed");
      };
    });
  });

  return null;
}
