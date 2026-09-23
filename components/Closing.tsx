"use client";

import { closing } from "@/data/home";
import { scrollToId } from "@/lib/scroll";
import { Icon } from "./Icons";

/** The closing invitation, on the dusk-blue of the opening film (the footer continues it). */
export function Closing() {
  return (
    <section id="contact" className="closing" aria-labelledby="closing-title">
      <div className="closing__inner">
        <p className="eyebrow eyebrow--light" data-reveal>
          {closing.eyebrow}
        </p>
        <h2 id="closing-title" className="closing__title" data-reveal>
          {closing.title[0]} <em>{closing.title[1]}</em>
        </h2>
        <p className="closing__lead" data-reveal-text>
          {closing.lead}
        </p>
        <div className="closing__actions" data-reveal>
          <button type="button" className="btn btn--red" onClick={() => scrollToId(closing.primary.target)}>
            {closing.primary.label}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => scrollToId(closing.secondary.target)}>
            {closing.secondary.label}
            <Icon name="arrowUpRight" className="btn__icon" />
          </button>
        </div>
      </div>
    </section>
  );
}
