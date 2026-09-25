import Image from "next/image";
import Link from "next/link";
import StaggeredMenu, {
  type StaggeredMenuItem,
  type StaggeredMenuSocialItem,
} from "@/components/StaggeredMenu/StaggeredMenu";

import "./MosaicPage.css";

const MOSAIC_MENU_ITEMS: StaggeredMenuItem[] = [
  { label: "Main Page", ariaLabel: "Return to the main landing page", link: "/" },
];

const MOSAIC_SOCIAL_ITEMS: StaggeredMenuSocialItem[] = [
  { label: "Instagram", link: "https://www.instagram.com/team_ecssa" },
  { label: "LinkedIn", link: "https://www.linkedin.com/company/ecssa-sfit/" },
  { label: "GitHub", link: "https://github.com" },
];

/**
 * MOSAIC 2026 landing spot with StaggeredMenu styled in MOSAIC's #eee500 yellow theme.
 */
export default function MosaicPage() {
  return (
    <>
      <StaggeredMenu
        isFixed
        logoUrl="/landingpage/logo.png"
        logoHref="/"
        items={MOSAIC_MENU_ITEMS}
        socialItems={MOSAIC_SOCIAL_ITEMS}
        displaySocials={true}
        displayItemNumbering={true}
        colors={["#000000", "#1e1e1e", "#eee500"]}
        accentColor="#eee500"
        panelBg="#0a0a0c"
        panelColor="#ffffff"
        menuButtonColor="#000000"
        openMenuButtonColor="#eee500"
        changeMenuColorOnOpen={true}
      />

      <main className="mosaic-page">
        {/* data-text feeds the ::before / ::after glitch copies in MosaicPage.css.
            Those copies are generated content, so without the aria-label the
            accessibility tree would announce the heading three times. */}
        <h1 className="mosaic-page__title" data-text="UNDER CONSTRUCTION" aria-label="Under Construction">
          UNDER CONSTRUCTION
        </h1>

        <Image
          src="/mosaicpage/mosaic.png"
          alt="MOSAIC 2026 — ECSSA's technical fest"
          width={1200}
          height={1200}
          className="mosaic-page__logo"
          priority
        />

        <Link href="/" className="mosaic-page__back">
          BACK TO HOME
        </Link>
      </main>
    </>
  );
}
