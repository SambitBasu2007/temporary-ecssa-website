"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// The no-js class is removed after hydration so reveal styles arm without causing SSR mismatch.

type RevealTag = "div" | "li" | "article" | "section" | "p";

interface RevealProps {
  children: ReactNode;
  /** Extra delay for stagger, in ms (0–600). */
  delay?: number;
  className?: string;
  tag?: RevealTag;
}

/**
 * Scroll-reveal wrapper: fades/rises its content in the first time it enters
 * the viewport. CSS does the animating (transform + opacity only); this
 * component only toggles the `is-revealed` class via IntersectionObserver.
 *
 * - Skipped entirely under `prefers-reduced-motion` (content shows instantly).
 * - Without JS (html.no-js) content shows instantly too.
 */
export default function Reveal({ children, delay = 0, className, tag: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("no-js");
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setArmed(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setArmed(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [setArmed]);

  const style = delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined;
  const classes = ["reveal", armed ? "is-revealed" : "", className ?? ""].filter(Boolean).join(" ");

  return (
    <Tag ref={ref as never} className={classes} style={style}>
      {children}
    </Tag>
  );
}
