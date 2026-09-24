import { site } from "@/data/site";
import { Icon } from "./Icons";
import { Logo } from "./Logo";

/** The page footer: where to find the studio, how to reach it, and the logo, large, to sign off. */
export function Footer() {
  return (
    <footer className="site-footer theme-dark">
      <div className="footer">
        <div className="footer__top">
          <p className="footer__tagline">
            Spaces that feel <em>like home.</em>
          </p>
          <a className="footer__mail" href={`mailto:${site.contact.email}`}>
            {site.contact.email}
            <Icon name="arrowUpRight" className="footer__mail-icon" />
          </a>
        </div>

        <div className="footer__cols">
          <div>
            <h2 className="footer__label">Visit</h2>
            <p className="footer__line">
              <Icon name="pin" className="footer__icon" />
              {site.contact.address}
            </p>
            <p className="footer__line">{site.contact.hours}</p>
          </div>
          <div>
            <h2 className="footer__label">Write or call</h2>
            <a className="footer__line" href={`mailto:${site.contact.email}`}>
              <Icon name="mail" className="footer__icon" />
              {site.contact.email}
            </a>
            <a className="footer__line" href={`tel:${site.contact.phone.replace(/\s+/g, "")}`}>
              <Icon name="phone" className="footer__icon" />
              {site.contact.phone}
            </a>
          </div>
          <div>
            <h2 className="footer__label">Explore</h2>
            {site.nav.map((n) => (
              <a key={n.target} className="footer__line" href={`#${n.target}`}>
                {n.label}
              </a>
            ))}
          </div>
          <div>
            <h2 className="footer__label">Follow</h2>
            {site.social.map((s) => (
              <a key={s.label} className="footer__line" href={s.href} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <Logo className="footer__logo" />

        <p className="footer__base">
          <span>
            © {new Date().getFullYear()} {site.name}. Bengaluru, India.
          </span>
          <a href="#top" className="footer__top-link">
            Back to top
            <Icon name="arrowUpRight" className="footer__icon footer__icon--up" />
          </a>
        </p>
      </div>
    </footer>
  );
}
