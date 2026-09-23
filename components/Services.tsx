import { services } from "@/data/home";
import { Icon } from "./Icons";
import { BookingCard } from "./BookingCard";

/** What's included on the left; the booking card on the right. */
export function Services() {
  return (
    <section id="services" className="section included" aria-labelledby="services-title">
      <div className="included__list">
        <p className="eyebrow" data-reveal>
          {services.eyebrow}
        </p>
        <h2 id="services-title" className="title" data-reveal>
          {services.title[0]} <em>{services.title[1]}</em>
        </h2>
        <ul className="services">
          {services.items.map((s) => (
            <li key={s.title} className="service" data-reveal>
              <span className="service__icon">
                <Icon name={s.icon} />
              </span>
              <div>
                <h3 className="service__title">{s.title}</h3>
                <p className="service__body">{s.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div id="book" className="included__book">
        <BookingCard />
      </div>
    </section>
  );
}
