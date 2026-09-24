"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

import "./Hero.css";

export default function Hero() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <section id="hero" className="hero">
      <div className="hero__inner">
        <div className="hero__content" data-stagger>

          {/* Logo + MOSAIC registration. On desktop they sit side by side as two
              equally sized sections; on mobile they stack with the button on top. */}
          <div className="hero__top">
            {/* Logo area — click the PNG to play the WebM animation (click again to stop) */}
            <div className="hero__logo-wrap">
              {showVideo ? (
                <video
                  className="hero__logo hero__logo--video"
                  src="/landingpage/logo.webm"
                  width={482}
                  height={476}
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-label="ECSSA animated logo"
                  onClick={() => setShowVideo(false)}
                />
              ) : (
                <>
                  <Image
                    src="/landingpage/logo.png"
                    alt="ECSSA — Electronics and Computer Science Student Association"
                    width={482}
                    height={476}
                    className="hero__logo"
                    priority
                  />
                  {/* Hit area: inset 8 px on every side so it's visibly smaller than the image */}
                  <button
                    className="hero__logo-btn"
                    onClick={() => setShowVideo(true)}
                    aria-label="Animate the ECSSA logo"
                  />
                </>
              )}
            </div>

            <div className="hero__promo">
              <Image
                src="/landingpage/mosaic.png"
                alt="MOSAIC — ECSSA's technical fest"
                width={1200}
                height={1200}
                className="hero__promo-logo"
              />
              {/* data-text feeds the ::before / ::after glitch copies in Hero.css.
                  The copies are real generated content, so the accessibility tree
                  would read the label three times — aria-label keeps it to one. */}
              <Link
                href="/mosaic"
                className="hero__register"
                data-text="REGISTER FOR MOSAIC"
                aria-label="REGISTER FOR MOSAIC"
              >
                REGISTER FOR MOSAIC
              </Link>
            </div>
          </div>

          <p className="hero__tagline">Innovate • Collaborate • Inspire</p>

          <p className="hero__intro">
            The official student association of Electronics &amp; Computer Science
          </p>

          <div className="hero__actions">
            <Link href="#about" className="btn btn--primary">
              Explore
            </Link>
            <Link href="#join" className="btn btn--secondary">
              Join Us
            </Link>
          </div>

        </div>
      </div>

      <a href="#about" className="hero__scroll" aria-label="Scroll to the About section">
        <span className="hero__scroll-label">Scroll</span>
        <span className="hero__scroll-icon">
          <CaretDown size={24} aria-hidden="true" />
        </span>
      </a>
    </section>
  );
}
