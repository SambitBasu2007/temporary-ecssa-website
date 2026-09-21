import Image from "next/image";
import Link from "next/link";
import { GithubLogo, InstagramLogo, LinkedinLogo } from "@phosphor-icons/react/dist/ssr";

import "./Footer.css";

const QUICK_LINKS = [
  { label: "About", href: "#about" },
  { label: "Domains", href: "#domains" },
  { label: "Events", href: "#events" },
  { label: "Gallery", href: "#gallery" },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/team_ecssa", Icon: InstagramLogo },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/ecssa-sfit/", Icon: LinkedinLogo },
  { label: "GitHub", href: "#", Icon: GithubLogo },
];

export default function Footer() {
  return (
    <footer id="join" className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__column">
          <Image
            src="/landingpage/college-logo.png"
            alt="College emblem"
            width={300}
            height={267}
            className="site-footer__emblem"
          />
          <p className="site-footer__college">St. Francis Institution of Technology</p>
        </div>

        <nav className="site-footer__column site-footer__column--center" aria-label="Footer">
          <ul className="site-footer__links">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="site-footer__link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__column site-footer__column--end">
          <ul className="site-footer__socials">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => {
              // real accounts open in a new tab; the placeholder entries keep the
              // in-page behaviour
              const isExternal = href.startsWith("http");
              return (
                <li key={label}>
                  <a
                    href={href}
                    className="site-footer__social"
                    aria-label={`ECSSA on ${label}`}
                    {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <Icon size={24} aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="container site-footer__bottom-inner">
          <p className="site-footer__legal">© 2026 ECSSA. All rights reserved.</p>
          <p className="site-footer__legal">Innovate • Collaborate • Inspire</p>
        </div>
      </div>
    </footer>
  );
}
