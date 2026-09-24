import type { Metadata, Viewport } from "next";

import MosaicPage from "@/components/mosaicpage/MosaicPage";

export const metadata: Metadata = {
  title: "Under Construction | MOSAIC 2026",
  description:
    "MOSAIC 2026 registration is on its way. Check back soon for the ECSSA technical fest.",
};

export const viewport: Viewport = {
  themeColor: "#eee500",
  colorScheme: "light",
};

export default function Page() {
  return <MosaicPage />;
}
