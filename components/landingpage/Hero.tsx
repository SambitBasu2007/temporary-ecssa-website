"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

import HeroSketch from "./HeroSketch";
import "./Hero.css";

export default function Hero() {
  const [showLottie, setShowLottie] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showLottie || !canvasRef.current) return;

    let dotLottie: import("@lottiefiles/dotlottie-web").DotLottie | null = null;

    import("@lottiefiles/dotlottie-web").then(({ DotLottie }) => {
      dotLottie = new DotLottie({
        canvas: canvasRef.current!,
        src: "/landingpage/logo.lottie",
        autoplay: true,
        loop: true,
      });
    });

    return () => {
      dotLottie?.destroy();
    };
  }, [showLottie]);

  return (
    <section id="hero" className="hero">
      {/* the interactive background: an auto-drafting pen you can also draw with */}
      <HeroSketch />

      <div className="hero__inner">
        <div className="hero__content" data-stagger>

          {/* Logo area — click the PNG to switch to the Lottie animation */}
          <div className="hero__logo-wrap">
            {showLottie ? (
              <canvas
                ref={canvasRef}
                className="hero__logo hero__logo--lottie"
                width={504}
                height={495}
                aria-label="ECSSA animated logo"
                onClick={() => setShowLottie(false)}
              />
            ) : (
              <>
                <Image
                  src="/landingpage/logo.png"
                  alt="ECSSA — Electronics and Computer Science Student Association"
                  width={504}
                  height={495}
                  className="hero__logo"
                  priority
                />
                {/* Hit area: inset 8 px on every side so it's visibly smaller than the image */}
                <button
                  className="hero__logo-btn"
                  onClick={() => setShowLottie(true)}
                  aria-label="Animate the ECSSA logo"
                />
              </>
            )}
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
