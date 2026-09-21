"use client";

import { useEffect, useRef } from "react";

import "./HeroSketch.css";

/**
 * Runs the ported p5 sketch (lib/hero-sketch.ts) inside the hero, behind the
 * copy. p5 is imported lazily so its weight never lands in the initial bundle,
 * and the sketch is skipped entirely when the visitor prefers reduced motion.
 *
 * The sketch is decoration: if it cannot start, the hero still renders.
 */
export default function HeroSketch() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let teardown: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      try {
        const [{ default: p5 }, { mountHeroSketch }] = await Promise.all([
          import("p5"),
          import("@/lib/hero-sketch"),
        ]);
        if (cancelled) return;
        teardown = mountHeroSketch(host, p5);
      } catch (error) {
        console.warn("Hero sketch unavailable", error);
      }
    })();

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, []);

  return <div ref={hostRef} className="hero-sketch" aria-hidden="true" />;
}
