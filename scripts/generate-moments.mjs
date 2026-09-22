/**
 * Generates the temporary placeholder photos for the Moments carousel in
 * public/moments/. Replace these files with real event photos (same file
 * names) and the carousel picks them up with no code changes.
 *
 * Run: node scripts/generate-moments.mjs
 *
 * Uses sharp, which ships with Next.js's image optimizer — if it is ever
 * missing, run: npm install -D sharp
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve("public/moments");
mkdirSync(OUT, { recursive: true });

// Only palette colors: navy #041b3b, blue #0374df, and their in-palette mix.
const BACKGROUNDS = ["#041b3b", "#0374df", "#0a3a78", "#041b3b", "#0374df", "#0a3a78"];

for (let i = 0; i < 6; i++) {
  const n = String(i + 1).padStart(2, "0");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1280">
  <rect width="1024" height="1280" fill="${BACKGROUNDS[i]}"/>
  <text x="512" y="780" font-family="sans-serif" font-size="560" font-weight="700" fill="#ffffff" fill-opacity="0.16" text-anchor="middle">${n}</text>
  <text x="512" y="1180" font-family="sans-serif" font-size="44" letter-spacing="10" fill="#ffffff" fill-opacity="0.55" text-anchor="middle">ECSSA · MOMENTS</text>
</svg>`;
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT, `moment-${n}.jpg`));
  console.log("wrote", `public/moments/moment-${n}.jpg`);
}
