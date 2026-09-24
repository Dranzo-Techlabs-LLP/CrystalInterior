"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const INTERACTIVE = "[data-cursor], a, button, select, input, textarea, label, summary";

/**
 * A ring that trails the mouse on desktop; the system cursor stays as it is.
 * It swells over anything clickable and reads "View" over photographs.
 * Nothing at all on touch screens or with reduced motion.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!query.matches) return;
    const el = ring.current!;
    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    let visible = false;

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!visible) {
        gsap.set(el, { x: e.clientX, y: e.clientY });
        el.dataset.visible = "true";
        visible = true;
      }
      x(e.clientX);
      y(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest?.(INTERACTIVE);
      el.dataset.state = target ? target.getAttribute("data-cursor") || "link" : "";
    };
    const leave = () => {
      el.dataset.visible = "false";
      visible = false;
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={ring} className="cursor" aria-hidden>
      <span className="cursor__ring" />
      <span className="cursor__label">View</span>
    </div>
  );
}
