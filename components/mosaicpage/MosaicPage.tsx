import Image from "next/image";
import Link from "next/link";

import "./MosaicPage.css";

/**
 * MOSAIC 2026 landing spot — the hero's "REGISTER FOR MOSAIC" button leads here
 * until the real registration flow exists. Deliberately chrome-free: no header,
 * no footer, just the signpost and the fest artwork on MOSAIC's yellow.
 */
export default function MosaicPage() {
  return (
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
  );
}
