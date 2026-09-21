https://temporary-ecssa-website.vercel.app/

# ECSSA — Electronics & Computer Science Student Association

Official single-page landing page. **Next.js (App Router) + React + TypeScript**, styled with
**plain CSS** (one stylesheet per component, plus design tokens in `app/globals.css`). No Tailwind,
no animation libraries, no emojis — icons come from Phosphor.

The hero runs an interactive **p5 sketch** as its background: a pen continuously drafts circuits,
code panels, flowcharts and equations across the section, and moving the cursor (or a finger) draws
with the same brush. Every figure fades out about three seconds after it lands.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run typecheck
npm run assets   # regenerate favicon.ico + og-image.png placeholders
```

## Layout

```
app/         layout.tsx · page.tsx · globals.css · icon.svg
components/landingpage/
             Header · Hero · HeroSketch · About · Domains · Events · Gallery · Committee · Footer
             (one folder per page — add components/<page>/ as new pages are built)
lib/         hero-sketch.ts        ← the ported p5 sketch
public/      landingpage/ · events/ · committee/ · gallery/
scripts/     generate-assets.mjs · import-hero-sketch.mjs
```

## Colors — light theme, fixed

Four colors: black, white, `#041b3b` (navy) and `#0374df` (blue). Everything translucent below is a
tint of one of those.

| Token | Value | Usage |
| --- | --- | --- |
| `--bg` | `#ffffff` | page background |
| `--bg-tint` | `rgba(4,27,59,.035)` | alternating sections, footer |
| `--black` | `#000000` | body copy |
| `--navy` | `#041b3b` | headings, wordmark |
| `--blue` | `#0374df` | accents — buttons, links, borders, hover |
| `--text-muted` | `rgba(4,27,59,.68)` | secondary copy |
| `--border` | `rgba(4,27,59,.14)` | hairlines |
| `--halo` | white text-shadow | keeps hero copy legible over the sketch |

There is no dark mode.

## The hero sketch

`lib/hero-sketch.ts` is a verbatim port of the standalone **CS & Circuit Brush** p5 page, with a
small mount/unmount API appended for React (`components/HeroSketch.tsx` mounts it lazily, so p5 only
downloads when the hero is on screen, and skips the sketch entirely under
`prefers-reduced-motion`). p5 runs in global mode, which is what lets the sketch's bare
`createCanvas` / `random` / `millis` calls keep working unchanged.

To re-sync from the original playground:

```bash
node scripts/import-hero-sketch.mjs "<path to the playground index.html>"
```

The importer rewrites the sketch into a module (renames the declarations the page shadowed, hands in
the host element, keeps the pointerleave handler removable) and fails loudly if the source moved.

## Placeholder assets to replace

| File | Replace with |
| --- | --- |
| `public/landingpage/logo.png` | the real logo wordmark (then update the `src` in `Header.tsx` / `Hero.tsx`) |
| `public/landingpage/college-logo.png` | the real college emblem |
| `public/landingpage/og-image.png` | a branded 1200×630 social card |
| `public/favicon.ico` | exported from the real logo |
| Picsum URLs in `Events.tsx` / `Gallery.tsx` | real photographs in `public/events/` and `public/gallery/` |

Those four images are in-palette placeholders drawn by `npm run assets` and by hand. They are served
`unoptimized` (they are SVG, and swapping in a PNG works the same way).

Committee member names are still `[Name 1]`…`[Name 4]` in `components/Committee.tsx`, and the MOSAIC
date/venue read `TBD` in `components/Events.tsx` — fill those in when confirmed.

Future work is tracked in [future-scope.md](./future-scope.md).
