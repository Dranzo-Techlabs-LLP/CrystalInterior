"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collage } from "@/data/home";
import { clsx } from "@/lib/clsx";
import { Icon } from "./Icons";
import { DecoBars } from "./Logo";

/**
 * A photo collage of one home from several angles. The photos drift gently
 * inside their frames as the page scrolls. Any photo opens in a lightbox
 * (native <dialog>: focus is trapped, Escape closes, focus returns to the
 * photo you opened); arrow keys move between photos.
 */
export function Collage() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const items = collage.items;
  const item = items[index];

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = useCallback(
    (d: number) => setIndex((i) => (i + d + items.length) % items.length),
    [items.length],
  );

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!el.open) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  return (
    <section id="homes" className="section collage-section theme-light" aria-labelledby="homes-title">
      <div className="collage-section__head">
        <div>
          <p className="eyebrow" data-reveal>
            <DecoBars />
            {collage.eyebrow}
          </p>
          <h2 id="homes-title" className="title" data-split>
            {collage.title[0]} <em className="hl">{collage.title[1]}</em>
          </h2>
        </div>
        <p className="collage-section__note" data-reveal>
          {collage.note}
        </p>
      </div>

      <ul className="collage">
        {items.map((it, i) => (
          <li key={it.id} className={clsx("collage__item", `collage__item--${i}`)} data-reveal>
            <button type="button" className="collage__button" onClick={() => open(i)} data-cursor="view">
              <span className="collage__media">
                <img src={it.src} alt={it.alt} loading="lazy" decoding="async" className="collage__img" data-parallax />
              </span>
              <span className="collage__caption">
                <span className="collage__num">{String(i + 1).padStart(2, "0")}</span>
                {it.caption}
              </span>
              <span className="collage__expand" aria-hidden>
                <Icon name="expand" />
              </span>
              <span className="sr-only">, open larger</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={item.caption}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <figure className="lightbox__figure">
          <img key={item.full} src={item.full} alt={item.alt} className="lightbox__img" />
          <figcaption className="lightbox__caption">
            <span>{item.caption}</span>
            <span className="lightbox__count">
              {index + 1} / {items.length}
            </span>
          </figcaption>
        </figure>
        <button type="button" className="lightbox__btn lightbox__close" onClick={() => dialog.current?.close()} aria-label="Close">
          <Icon name="close" />
        </button>
        <button type="button" className="lightbox__btn lightbox__prev" onClick={() => step(-1)} aria-label="Previous photo">
          <Icon name="arrowLeft" />
        </button>
        <button type="button" className="lightbox__btn lightbox__next" onClick={() => step(1)} aria-label="Next photo">
          <Icon name="arrowRight" />
        </button>
      </dialog>
    </section>
  );
}
