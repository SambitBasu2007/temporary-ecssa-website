import Image from "next/image";
import Link from "next/link";
import { CalendarBlank, MapPin } from "@phosphor-icons/react/dist/ssr";

import Reveal from "./Reveal";
import "./Events.css";

export default function Events() {
  return (
    <section id="events" className="section section--plain">
      <div className="container">
        <Reveal>
          <h2 className="section-title">Upcoming Events</h2>
        </Reveal>

        <Reveal delay={120} tag="article" className="event-card">
          <div className="event-card__media">
            {/* Same photo as the first card in the Moments carousel
                (public/moments/moment-01.png) — swap both for a real MOSAIC shot */}
            <Image
              src="/events/mosaic.jpg"
              alt="Attendees at a past ECSSA technical fest"
              width={600}
              height={400}
              className="event-card__image"
            />
          </div>

          <div className="event-card__body">
            <span className="event-card__badge">Technical Fest</span>
            <h3 className="event-card__title">MOSAIC 2026</h3>
            <p className="event-card__description">
              Our flagship technical fest bringing together coders, builders, and innovators across
              departments.
            </p>

            <ul className="event-card__meta">
              <li className="event-card__meta-item">
                <CalendarBlank size={18} aria-hidden="true" />
                <span>Date: TBD</span>
              </li>
              <li className="event-card__meta-item">
                <MapPin size={18} aria-hidden="true" />
                <span>Venue: TBD</span>
              </li>
            </ul>

            <Link href="#join" className="btn btn--primary event-card__cta">
              Register Interest
            </Link>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="section-note events__note">More events coming soon — stay tuned.</p>
        </Reveal>
      </div>
    </section>
  );
}
