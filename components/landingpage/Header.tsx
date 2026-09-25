"use client";

import Image from "next/image";
import Link from "next/link";
import StaggeredMenu, {
  type StaggeredMenuItem,
  type StaggeredMenuSocialItem,
} from "@/components/StaggeredMenu/StaggeredMenu";

import "./Header.css";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Domains", href: "#domains" },
  { label: "Events", href: "#events" },
  { label: "Gallery", href: "#gallery" },
];


const MENU_ITEMS: StaggeredMenuItem[] = [
  { label: "About", ariaLabel: "Learn about ECSSA", link: "#about" },
  { label: "Domains", ariaLabel: "Explore Electronics & CS domains", link: "#domains" },
  { label: "Events", ariaLabel: "Upcoming events", link: "#events" },
  { label: "Gallery", ariaLabel: "Moments photo gallery", link: "#gallery" },
  { label: "Join Us", ariaLabel: "Connect with ECSSA", link: "#join" },
  { label: "MOSAIC 2026", ariaLabel: "Visit MOSAIC technical fest page", link: "/mosaic" },
];

const SOCIAL_ITEMS: StaggeredMenuSocialItem[] = [
  { label: "Instagram", link: "https://www.instagram.com/team_ecssa" },
  { label: "LinkedIn", link: "https://www.linkedin.com/company/ecssa-sfit/" },
  { label: "GitHub", link: "https://github.com" },
];

export default function Header() {
  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="#hero" className="site-header__brand" aria-label="ECSSA — back to top">
            <Image
              src="/landingpage/logo.png"
              alt="ECSSA — Electronics and Computer Science Student Association"
              width={482}
              height={476}
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
            <span className="site-header__cta-spacer" aria-hidden="true" />
          </nav>
        </div>
      </header>

      <StaggeredMenu
        isFixed
        items={MENU_ITEMS}
        socialItems={SOCIAL_ITEMS}
        displaySocials={true}
        displayItemNumbering={true}
        colors={["#041b3b", "#025bb5", "#0374df"]}
        accentColor="#0374df"
        menuButtonColor="#041b3b"
        openMenuButtonColor="#041b3b"
        changeMenuColorOnOpen={true}
      />
    </>
  );
}
