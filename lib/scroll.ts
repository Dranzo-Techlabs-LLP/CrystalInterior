import type Lenis from "lenis";

/** Shared handle on Lenis so any link can request a smooth scroll. */
let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

/** Smooth-scroll to an element id (falls back to native scrolling). */
export function scrollToId(id: string) {
  const el = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 72;
  if (lenis) lenis.scrollTo(y, { duration: 1.4 });
  else {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  }
}

/** Freeze page scrolling (menu open, intro playing) and release it again. */
export function setScrollLocked(locked: boolean) {
  document.documentElement.classList.toggle("is-locked", locked);
  if (locked) lenis?.stop();
  else lenis?.start();
}
