"use client";

import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { scrollToId } from "@/lib/scroll";
import { clsx } from "@/lib/clsx";
import { Logo } from "./Logo";

/**
 * Transparent over the opening film; once the cream sheet slides up to the top
 * it becomes a solid cream bar. On phones the links fold into a menu sheet.
 */
export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const intro = document.getElementById("intro");
    let raf = 0;
    const check = () => {
      raf = 0;
      if (intro) setSolid(intro.getBoundingClientRect().top <= 72);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (target: string) => {
    setOpen(false);
    scrollToId(target);
  };

  return (
    <header className={clsx("header", solid && "header--solid", open && "header--open")}>
      <a
        href="#top"
        className="header__brand"
        onClick={(e) => {
          e.preventDefault();
          setOpen(false);
          window.scrollTo({ top: 0 });
        }}
        aria-label={`${site.name}, back to top`}
      >
        <Logo />
      </a>

      <nav className="header__nav" aria-label="Primary">
        {site.nav.map((item) => (
          <a
            key={item.target}
            href={`#${item.target}`}
            className="header__link"
            onClick={(e) => {
              e.preventDefault();
              go(item.target);
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="header__end">
        <a
          href={`#${site.cta.target}`}
          className="btn btn--small btn--red header__cta"
          onClick={(e) => {
            e.preventDefault();
            go(site.cta.target);
          }}
        >
          {site.cta.label}
        </a>
        <button
          type="button"
          className="header__menu"
          aria-expanded={open}
          aria-controls="menu-sheet"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span className="header__menu-bars" aria-hidden />
        </button>
      </div>

      <div id="menu-sheet" className="menu-sheet" data-open={open} hidden={!open}>
        {site.nav.map((item) => (
          <a
            key={item.target}
            href={`#${item.target}`}
            className="menu-sheet__link"
            onClick={(e) => {
              e.preventDefault();
              go(item.target);
            }}
          >
            {item.label}
          </a>
        ))}
        <a
          href={`#${site.cta.target}`}
          className="btn btn--red"
          onClick={(e) => {
            e.preventDefault();
            go(site.cta.target);
          }}
        >
          {site.cta.label}
        </a>
      </div>
    </header>
  );
}
