"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";

import Reveal from "./Reveal";
import "./Gallery.css";

// Temporary placeholder photos — drop the real shots into public/moments/ and
// point these at them.
const MOMENTS = [
  {
    image: "/moments/moment-01.png",
    text: "MOSAIC '26",
  },
  {
    image: "/moments/moment-01.png",
    text: "something",
  },
  {
    image: "/moments/moment-01.png",
    text: "something",
  },
  {
    image: "/moments/moment-01.png",
    text: "something",
  },
  {
    image: "/moments/moment-01.png",
    text: "something",
  },
  {
    image: "/moments/moment-01.png",
    text: "something",
  },
];

// The rail holds several identical copies of the list and always settles in the
// middle one. The extra copies either side are slack, so a hard flick can run
// for thousands of pixels without ever reaching the true end of the strip.
const COPY_COUNT = 5;
const MIDDLE_COPY = (COPY_COUNT - 1) / 2;
const SLIDES = Array.from({ length: COPY_COUNT }, () => MOMENTS).flat();

// How long the rail must be still before it is safe to re-centre.
const IDLE_DELAY_MS = 160;

export default function Gallery() {
  const railRef = useRef<HTMLUListElement>(null);
  const copyWidthRef = useRef(0);
  const idleTimerRef = useRef<number | undefined>(undefined);

  // Width of one copy, measured between the first card of copy 1 and the first
  // card of copy 2, so gaps and padding are accounted for exactly.
  const measureCopy = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = rail.querySelectorAll<HTMLElement>(".gallery__item");
    if (cards.length < MOMENTS.length * 2) return;
    const width = cards[MOMENTS.length].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
    if (width > 0) copyWidthRef.current = width;
  }, []);

  // The loop, done by shifting the rail a whole copy at a time. Since every copy
  // is identical, the shift is invisible — but only if nothing else is happening:
  // jumping mid-flick cancels the browser's momentum and fights scroll-snap,
  // which is what made fast scrolling stutter or stick. So it is deferred until
  // the rail is actually at rest.
  const recenter = useCallback(() => {
    const rail = railRef.current;
    const copyWidth = copyWidthRef.current;
    if (!rail || !copyWidth) return;

    // Stay at least one copy of content off each hard end, so the strip never
    // runs out from under the viewport (whatever its width).
    const min = copyWidth;
    const max = rail.scrollWidth - copyWidth - rail.clientWidth;
    let next = rail.scrollLeft;
    if (next >= min && next < max) return;
    while (next >= max) next -= copyWidth;
    while (next < min) next += copyWidth;

    rail.scrollTo({ left: next, behavior: "instant" });
  }, []);

  // Start inside the middle copy (all copies look the same, so nothing moves).
  // `instant` matters: the rail eases scrolling in CSS, and this must not slide.
  useEffect(() => {
    measureCopy();
    const rail = railRef.current;
    if (!rail || !copyWidthRef.current) return;
    rail.scrollTo({ left: copyWidthRef.current * MIDDLE_COPY, behavior: "instant" });
  }, [measureCopy]);

  // A resize changes the copy width, so re-measure and re-centre together —
  // otherwise the old copy width would point the loop at the wrong offsets.
  useEffect(() => {
    const onResize = () => {
      measureCopy();
      recenter();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureCopy, recenter]);

  // `scrollend` fires the moment the rail stops, momentum included, which is the
  // earliest safe point to re-centre. The timer in handleScroll is the fallback
  // for browsers without it.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onScrollEnd = () => recenter();
    rail.addEventListener("scrollend", onScrollEnd);
    return () => rail.removeEventListener("scrollend", onScrollEnd);
  }, [recenter]);

  useEffect(() => () => window.clearTimeout(idleTimerRef.current), []);

  // Deliberately does nothing while the scrolling is in flight.
  const handleScroll = useCallback(() => {
    window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(recenter, IDLE_DELAY_MS);
  }, [recenter]);

  // One photo per click; the step is measured from the rendered card so the gap
  // can change in CSS without this drifting out of sync, and the easing (plus
  // its reduced-motion opt-out) lives in Gallery.css.
  const scrollByCard = useCallback((direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>(".gallery__item");
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    const step = card ? card.offsetWidth + gap : rail.clientWidth * 0.8;
    rail.scrollBy({ left: step * direction });
  }, []);

  return (
    <section id="gallery" className="section section--tinted">
      <div className="container">
        <Reveal>
          <h2 className="section-title">Moments</h2>
        </Reveal>
      </div>

      {/* Full-bleed rail — a direct child of the section, outside .container, so
          the photos run edge to edge. Native horizontal overflow does the work:
          trackpad, touch, keyboard and the arrow buttons all just scroll it, and
          the handler above wraps it around. */}
      <ul
        className="gallery__rail"
        ref={railRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label="Moments — scroll horizontally to browse the photos"
      >
        {SLIDES.map((moment, index) => (
          <li key={index} className="gallery__item">
            <Image
              src={moment.image}
              alt={moment.text || `ECSSA moment ${(index % MOMENTS.length) + 1}`}
              width={1024}
              height={1280}
              sizes="(max-width: 767px) 60vw, 340px"
              className="gallery__image"
            />
            {moment.text ? <p className="gallery__text">{moment.text}</p> : null}
          </li>
        ))}
      </ul>

      <div className="container">
        <Reveal delay={150}>
          <div className="gallery__caption">
            <button
              type="button"
              className="gallery__arrow"
              onClick={() => scrollByCard(-1)}
              aria-label="Show previous photos"
            >
              <ArrowLeft size={16} weight="bold" aria-hidden="true" />
            </button>
            <span>Scroll</span>
            <button
              type="button"
              className="gallery__arrow"
              onClick={() => scrollByCard(1)}
              aria-label="Show next photos"
            >
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
