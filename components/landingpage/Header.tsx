"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Equals, X } from "@phosphor-icons/react";

import "./Header.css";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Domains", href: "#domains" },
  { label: "Events", href: "#events" },
  { label: "Gallery", href: "#gallery" },
];

const JOIN_HREF = "#join";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Lock body scroll while the mobile sidebar is open.
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  // Close on Escape and whenever the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const handleBreakpointChange = () => {
      if (desktopQuery.matches) setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", handleBreakpointChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", handleBreakpointChange);
    };
  }, [isMenuOpen]);

  // The sidebar and its backdrop are rendered *outside* the fixed header:
  // `backdrop-filter` on the header makes it the containing block for
  // fixed-position descendants, which would clip them to the header box.
  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="#hero" className="site-header__brand" aria-label="ECSSA — back to top">
            <Image
              src="/landingpage/logo.png"
              alt="ECSSA — Electronics and Computer Science Student Association"
              width={504}
              height={495}
              className="site-header__logo"
              priority
            />
          </Link>

          <nav className="site-nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="site-nav__link">
                {link.label}
              </Link>
            ))}
            <Link href={JOIN_HREF} className="btn btn--primary btn--sm site-header__cta">
              Join Us
            </Link>
          </nav>

          <button
            type="button"
            className="site-header__menu-button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-sidebar"
          >
            <Equals size={24} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        className={`sidebar-backdrop${isMenuOpen ? " sidebar-backdrop--open" : ""}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="mobile-sidebar"
        className={`sidebar${isMenuOpen ? " sidebar--open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!isMenuOpen}
      >
        <div className="sidebar__top">
          <Image
            src="/landingpage/logo.png"
            alt="ECSSA"
            width={504}
            height={495}
            className="sidebar__logo"
          />
          <button
            type="button"
            className="sidebar__close"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Mobile primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="sidebar__link"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href={JOIN_HREF}
          className="btn btn--primary btn--block sidebar__cta"
          onClick={() => setIsMenuOpen(false)}
        >
          Join Us
        </Link>
      </aside>
    </>
  );
}
