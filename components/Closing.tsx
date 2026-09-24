"use client";

import { closing } from "@/data/home";
import { scrollToId } from "@/lib/scroll";
import { Icon } from "./Icons";
import { Logo } from "./Logo";

/**
 * The closing invitation, set like the logo artwork itself: black on the
 * brand yellow, framed by the logo's Art Deco bars, which rise as it arrives.
 */
export function Closing() {
  return (
    <section id="contact" className="closing theme-yellow" aria-labelledby="closing-title">
      <div className="closing__frame closing__frame--left" aria-hidden>
        <span data-rise />
        <span data-rise />
        <span data-rise />
      </div>
      <div className="closing__inner">
        <Logo className="closing__logo" decorative />
        <p className="eyebrow eyebrow--center" data-reveal>
          {closing.eyebrow}
        </p>
        <h2 id="closing-title" className="closing__title" data-split>
          {closing.title[0]} <em>{closing.title[1]}</em>
        </h2>
        <p className="closing__lead" data-reveal>
          {closing.lead}
        </p>
        <div className="closing__actions" data-reveal>
          <button type="button" className="btn btn--dark" onClick={() => scrollToId(closing.primary.target)}>
            {closing.primary.label}
            <span className="btn__orb" aria-hidden>
              <Icon name="arrowUpRight" />
            </span>
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => scrollToId(closing.secondary.target)}>
            {closing.secondary.label}
          </button>
        </div>
      </div>
      <div className="closing__frame closing__frame--right" aria-hidden>
        <span data-rise />
        <span data-rise />
        <span data-rise />
      </div>
    </section>
  );
}
