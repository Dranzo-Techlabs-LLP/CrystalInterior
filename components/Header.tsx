"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { site } from "@/data/site";
import { clsx } from "@/lib/clsx";
import { scrollToId, setScrollLocked } from "@/lib/scroll";
import { Icon } from "./Icons";
import { Logo } from "./Logo";

const FOCUSABLE = "a[href], button:not([disabled])";

/**
 * Transparent over the opening film, then a black bar once the intro sheet
 * reaches the top. It tucks away while you read down the page and comes back
 * as soon as you scroll up. The current section is marked in the navigation.
 * Below 960px the links move into a full-screen menu.
 */
export function Header() {
  const [solid, setSolid] = useState(false);
  const [tucked, setTucked] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  // solid once the intro sheet is at the top; tucked away while scrolling down
  useEffect(() => {
    const intro = document.getElementById("intro");
    let raf = 0;
    let lastY = window.scrollY;
    const check = () => {
      raf = 0;
      const top = intro ? intro.getBoundingClientRect().top : 0;
      setSolid(top <= 76);
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 8) {
        setTucked(y > lastY && top < -240);
        lastY = y;
      }
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

  // the section crossing the middle of the screen is the current one
  useEffect(() => {
    const sections = site.nav.map((n) => document.getElementById(n.target)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
          else setActive((cur) => (cur === e.target.id ? null : cur));
        });
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // the menu: lock the page, move focus in, Escape closes and returns focus
  useEffect(() => {
    if (!open) return;
    setScrollLocked(true);
    firstLink.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    const onResize = () => window.innerWidth > 960 && setOpen(false);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      setScrollLocked(false);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // keep Tab inside the header while the menu covers the page
  const trap = (e: KeyboardEvent<HTMLElement>) => {
    if (!open || e.key !== "Tab" || !header.current) return;
    const items = Array.from(header.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const go = (target: string) => {
    setOpen(false);
    // let the menu release the page before scrolling it
    requestAnimationFrame(() => scrollToId(target));
  };

  return (
    <header
      ref={header}
      className={clsx("header", solid && "header--solid", tucked && !open && "header--tucked", open && "header--open")}
      onKeyDown={trap}
      onFocusCapture={() => setTucked(false)}
    >
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
        <Logo decorative className="header__logo" />
      </a>

      <nav className="header__nav" aria-label="Primary">
        {site.nav.map((item) => (
          <a
            key={item.target}
            href={`#${item.target}`}
            className="header__link"
            aria-current={active === item.target ? "true" : undefined}
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
          className="btn btn--primary btn--small header__cta"
          onClick={(e) => {
            e.preventDefault();
            go(site.cta.target);
          }}
        >
          {site.cta.label}
        </a>
        <button
          ref={toggle}
          type="button"
          className="header__menu"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span className="header__menu-bars" aria-hidden />
        </button>
      </div>

      <div id="menu" className="menu" data-open={open} hidden={!open}>
        <nav className="menu__nav" aria-label="Menu">
          {site.nav.map((item, i) => (
            <a
              key={item.target}
              ref={i === 0 ? firstLink : undefined}
              href={`#${item.target}`}
              className="menu__link"
              style={{ "--i": i } as React.CSSProperties}
              onClick={(e) => {
                e.preventDefault();
                go(item.target);
              }}
            >
              <span className="menu__num">{String(i + 1).padStart(2, "0")}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="menu__foot">
          <a
            href={`#${site.cta.target}`}
            className="btn btn--primary btn--block"
            onClick={(e) => {
              e.preventDefault();
              go(site.cta.target);
            }}
          >
            {site.cta.label}
            <Icon name="arrowUpRight" className="btn__icon" />
          </a>
          <a className="menu__contact" href={`tel:${site.contact.phone.replace(/\s+/g, "")}`}>
            <Icon name="phone" className="menu__icon" />
            {site.contact.phone}
          </a>
          <a className="menu__contact" href={`mailto:${site.contact.email}`}>
            <Icon name="mail" className="menu__icon" />
            {site.contact.email}
          </a>
        </div>
      </div>
    </header>
  );
}
