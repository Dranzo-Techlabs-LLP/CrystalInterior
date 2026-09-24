import { services } from "@/data/home";
import { BookingCard } from "./BookingCard";
import { Icon } from "./Icons";
import { DecoBars } from "./Logo";

/** What's included, as a numbered list on the left; the booking card on the right. */
export function Services() {
  return (
    <section id="services" className="section included theme-light" aria-labelledby="services-title">
      <div className="included__list">
        <p className="eyebrow" data-reveal>
          <DecoBars />
          {services.eyebrow}
        </p>
        <h2 id="services-title" className="title" data-split>
          {services.title[0]} <em className="hl">{services.title[1]}</em>
        </h2>
        <ol className="services">
          {services.items.map((s, i) => (
            <li key={s.title} className="service" data-reveal>
              <span className="service__num">{String(i + 1).padStart(2, "0")}</span>
              <div className="service__text">
                <h3 className="service__title">{s.title}</h3>
                <p className="service__body">{s.body}</p>
              </div>
              <span className="service__icon" aria-hidden>
                <Icon name={s.icon} />
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div id="book" className="included__book">
        <BookingCard />
      </div>
    </section>
  );
}
