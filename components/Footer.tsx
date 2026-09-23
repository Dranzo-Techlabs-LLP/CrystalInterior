import { site } from "@/data/site";
import { Icon } from "./Icons";
import { Logo } from "./Logo";

/** The page footer: the matching logo, where to find the studio, and how to reach it. */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer">
        <div className="footer__brand">
          <Logo className="logo--light" />
          <p>{site.tagline}</p>
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
            <h2 className="footer__label">Follow</h2>
            {site.social.map((s) => (
              <a key={s.label} className="footer__line" href={s.href} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <p className="footer__base">
          © {new Date().getFullYear()} {site.name}. Bengaluru, India.
        </p>
      </div>
    </footer>
  );
}
