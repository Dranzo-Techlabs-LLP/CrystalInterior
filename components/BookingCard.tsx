"use client";

import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import { booking } from "@/data/home";
import { site } from "@/data/site";
import { Icon } from "./Icons";

const sizeLabel = (n: number) => (n >= booking.size.max ? `${booking.size.max - 1}+ BHK` : `${n} BHK`);

/** Today in the visitor's time zone (toISOString alone is UTC, a day behind in India before 05:30). */
function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
const noSubscription = () => () => {};

/**
 * A booking card in the spirit of a holiday-rental reservation panel: date and
 * home type side by side, a size stepper, and one yellow button. There are no
 * prices or availability here — the request goes to the studio by email.
 */
export function BookingCard() {
  const id = useId();
  // The server can't know the visitor's date, so `min` is only set in the browser.
  const minDate = useSyncExternalStore(noSubscription, localToday, () => undefined);
  const [size, setSize] = useState<number>(booking.size.initial);
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const lines = [
      `Name: ${data.get("name")}`,
      `Contact: ${data.get("contact")}`,
      `Preferred date: ${data.get("date") || "Flexible"}`,
      `Home: ${data.get("type")}, ${sizeLabel(size)}`,
      "",
      "I'd like to book a first consultation.",
    ];
    const subject = `Consultation request: ${data.get("type")}, ${sizeLabel(size)}`;
    window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    setSent(true);
  };

  return (
    <form className="booking theme-dark" onSubmit={submit} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="booking__title">
        {booking.title[0]} <em>{booking.title[1]}</em>
      </h3>
      <p className="booking__lead">{booking.lead}</p>

      <div className="booking__grid">
        <label className="booking__cell">
          <span className="booking__label">Preferred date</span>
          <input name="date" type="date" min={minDate} className="booking__input" />
        </label>
        <label className="booking__cell">
          <span className="booking__label">Home type</span>
          <select name="type" className="booking__input" defaultValue={booking.homeTypes[0]}>
            {booking.homeTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <div className="booking__cell booking__cell--wide" role="group" aria-labelledby={`${id}-size`}>
          <span id={`${id}-size`} className="booking__label">
            Home size
          </span>
          <div className="stepper">
            <output className="stepper__value" aria-live="polite">
              {sizeLabel(size)}
            </output>
            <button
              type="button"
              className="stepper__btn"
              onClick={() => setSize((s) => Math.max(booking.size.min, s - 1))}
              disabled={size <= booking.size.min}
              aria-label="Fewer bedrooms"
            >
              <Icon name="minus" />
            </button>
            <button
              type="button"
              className="stepper__btn"
              onClick={() => setSize((s) => Math.min(booking.size.max, s + 1))}
              disabled={size >= booking.size.max}
              aria-label="More bedrooms"
            >
              <Icon name="plus" />
            </button>
          </div>
        </div>
      </div>

      <div className="booking__contact">
        <label className="field">
          <span className="field__label">Your name</span>
          <input name="name" required autoComplete="name" className="field__input" />
        </label>
        <label className="field">
          <span className="field__label">Phone or email</span>
          <input name="contact" required autoComplete="email" className="field__input" />
        </label>
      </div>

      <button type="submit" className="btn btn--primary btn--block">
        {booking.button}
        <span className="btn__orb" aria-hidden>
          <Icon name="arrowUpRight" />
        </span>
      </button>
      <p className="booking__note" role="status">
        {sent ? "Your email app should now be open with the request ready to send." : booking.note}
      </p>
    </form>
  );
}
