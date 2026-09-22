# ECSSA — Electronics & Computer Science Student Association

Official single-page landing page. **Next.js (App Router) + React + TypeScript**, styled with
**plain CSS** (one stylesheet per component, plus design tokens in `app/globals.css`). No Tailwind,
no emojis — icons come from Phosphor. The Moments carousel uses **ogl** (WebGL), loaded
client-side only.

The hero is currently a **plain blank section**. An interactive p5 background sketch was removed;
its files are kept as comment-only placeholders with restore notes (see "The hero sketch" below).

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
lib/         hero-sketch.ts        ← emptied — p5 sketch disabled, restore notes inside
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

There is no dark mode.

## The hero sketch (currently removed)

The hero used to run a verbatim port of the standalone **CS & Circuit Brush** p5 page
(`lib/hero-sketch.ts`, mounted lazily by `components/landingpage/HeroSketch.tsx`). It has been
disabled: nothing imports either file, both are comment-only placeholders describing their original
shape and contents, and p5 adds nothing to the bundle.

To bring it back:

```bash
node scripts/import-hero-sketch.mjs "<path to the playground index.html>"
```

The importer regenerates `lib/hero-sketch.ts` verbatim (renames the declarations the page shadowed,
hands in the host element, keeps the pointerleave handler removable) and fails loudly if the source
moved. Then restore the `HeroSketch` component and its `<HeroSketch />` usage in `Hero.tsx` — the
comment blocks in each emptied file describe exactly what they contained. `p5` and `@types/p5` are
still declared in `package.json`, so no install step is needed.

## Placeholder assets to replace

| File | Replace with |
| --- | --- |
| `public/landingpage/logo.png` | the real logo wordmark (then update the `src` in `Header.tsx` / `Hero.tsx`) |
| `public/landingpage/college-logo.png` | the real college emblem |
| `public/landingpage/og-image.png` | a branded 1200×630 social card |
| `public/favicon.ico` | exported from the real logo |
| `public/events/mosaic.jpg` | a real MOSAIC photo (also copied to `public/moments/moment-01.jpg` for the carousel) |
| `public/moments/moment-0*.jpg` | real event photos — same file names, no code changes needed (`node scripts/generate-moments.mjs` regenerates the placeholders) |

Those four images are in-palette placeholders drawn by `npm run assets` and by hand. They are served
`unoptimized` (they are SVG, and swapping in a PNG works the same way).

Committee member names are still `[Name 1]`…`[Name 4]` in `components/Committee.tsx`, and the MOSAIC
date/venue read `TBD` in `components/Events.tsx` — fill those in when confirmed.

Future work is tracked in [future-scope.md](./future-scope.md).
