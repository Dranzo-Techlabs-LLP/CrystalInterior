"use client";

import { useEffect, useRef } from "react";
import { reviews } from "@/data/home";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { DecoBars } from "./Logo";
import { Star } from "./Icons";

/**
 * Reviews beside a quiet moving image of home life. The film loops without a
 * seam and melts into the black of the section; it stays paused for reduced motion.
 */
export function Reviews() {
  const video = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (reduced) v.pause();
    else v.play().catch(() => {});
  }, [reduced]);

  return (
    <section id="reviews" className="section reviews theme-dark" aria-labelledby="reviews-title">
      <div className="reviews__text">
        <p className="eyebrow" data-reveal>
          <DecoBars />
          {reviews.eyebrow}
        </p>
        <h2 id="reviews-title" className="title" data-split>
          {reviews.title[0]} <em>{reviews.title[1]}</em>
        </h2>
        <ul className="quotes">
          {reviews.items.map((r) => (
            <li key={r.name} className="quote" data-reveal>
              <span className="quote__stars" role="img" aria-label="Five stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="quote__star" />
                ))}
              </span>
              <blockquote className="quote__text">&ldquo;{r.quote}&rdquo;</blockquote>
              <p className="quote__by">
                {r.name} <span>{r.home}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div className="reviews__media" aria-hidden>
        <video
          ref={video}
          className="reviews__video"
          src={reviews.film.src}
          poster={reviews.film.poster}
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
    </section>
  );
}
