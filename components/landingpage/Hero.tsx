import Image from "next/image";
import Link from "next/link";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

import HeroSketch from "./HeroSketch";
import "./Hero.css";

export default function Hero() {
  return (
    <section id="hero" className="hero">
      {/* the interactive background: an auto-drafting pen you can also draw with */}
      <HeroSketch />

      <div className="hero__inner">
        <div className="hero__content" data-stagger>
          <Image
            src="/landingpage/logo.png"
            alt="ECSSA — Electronics and Computer Science Student Association"
            width={504}
            height={495}
            className="hero__logo"
            priority
          />

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

          <p className="hero__hint">
            Circuit and code figures draft themselves here — move your cursor or finger to draw too ·
            figures self-erase after about three seconds
          </p>
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
