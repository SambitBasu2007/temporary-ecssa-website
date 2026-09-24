[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149eca)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://typescriptlang.org)

# ECSSA — Electronics & Computer Science Student Association

**ECSSA** is the official student association of the Electronics & Computer Science department at
St. Francis Institute of Technology — a single community for everyone who loves the space where
hardware meets code: students who wire up circuits in the lab in the afternoon and push commits to
a side project at night.

We exist to bridge the two halves of our department. Through hands-on workshops, technical events
like our flagship **MOSAIC** fest, project builds, and a core committee that plans it all, ECSSA
is where members get their first soldering iron, their first pull request, and their first stage —
often in the same semester.

> **Innovate • Collaborate • Inspire**

This repository holds our official landing page: a fast, single-page site that introduces the
association, showcases what we do across our Electronics and Computer Science domains, and keeps
every upcoming event and committee contact one click away.

---

**Next.js (App Router) + React + TypeScript**, styled with **plain CSS** (one stylesheet per
component, plus design tokens in `app/globals.css`). No Tailwind, no emojis — icons come from
Phosphor. WebGL (ogl) and heavy media load client-side only.

## Highlights

- **Light theme built on four colors** — black, white, `#041b3b` (navy), `#0374df` (blue); every
  translucent shade is a tint of one of those
- **"What We Do" split** — an Electronics sub-section with an interactive 3D model viewer
  (Arduino Uno, ESP8266, Raspberry Pi, RAM — drag to orbit, auto-cycles every 5 s, original GLB
  colors) and a Computer Science sub-section with a terminal canvas that types out animated C
  snippets (stack, queue, linked list)
- **Moments rail** — an endless horizontal photo strip: identical copies of the list plus a
  wrap-around that only fires once the scroll has come to rest, so a fast flick is never
  interrupted; page scrolling is never hijacked
- **Click-to-animate hero logo** — the PNG wordmark swaps to a looping WebM on click, both locked
  to the same layout box
- **Scroll-reveal entrances** across sections, with `prefers-reduced-motion` and no-JS fallbacks

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run assets     # regenerate favicon + og-image placeholders
```

## Directory

```text
ecssa-web/
├─ app/                     Next.js App Router root
│  ├─ layout.tsx            Metadata, Open Graph/Twitter cards, fonts, no-js guard
│  ├─ page.tsx              Landing page — assembles the section components
│  ├─ globals.css           Design tokens, resets, shared section/button/reveal styles
│  ├─ mosaic/page.tsx       /mosaic — the "under construction" route
│  └─ icon.svg              SVG favicon route
├─ components/
│  ├─ mosaicpage/           The /mosaic page's own component + styles
│  └─ landingpage/          All landing-page sections (one folder per page as the site grows)
│     ├─ Header             Sticky translucent header + mobile sidebar
│     ├─ Hero               Logo (PNG ⇄ WebM), tagline, CTA buttons
│     ├─ HeroSketch         Comment-only placeholder of the removed p5 hero sketch
│     ├─ About              Intro copy and stats
│     ├─ Domains            "What We Do" — Electronics 3D viewer + CS code canvas
│     ├─ ModelViewer        React wrapper for the 3D stage, with lottie loading overlay
│     ├─ modelScene         ogl renderer: GLB loading, palette shader, orbit, auto-cycle
│     ├─ CodeCanvas         Terminal-style canvas that types C snippets on loop
│     ├─ Events             Upcoming-events card
│     ├─ Gallery            Moments — endless horizontal scroll rail of photos
│     ├─ Committee          Core committee grid
│     ├─ Footer             Links, socials, college credit
│     └─ Reveal             IntersectionObserver scroll-reveal wrapper
├─ lib/
│  └─ hero-sketch.ts        Comment-only placeholder of the disabled p5 sketch
├─ public/
│  ├─ landingpage/          logo.png · logo.webm (hero animation) · mosaic.png · college-logo.png · og-image.png
│  ├─ mosaicpage/           mosaic.png for the /mosaic page
│  ├─ assets/               GLB models for the 3D viewer + logo.lottie (loading animation)
│  ├─ moments/              Photos for the Moments rail
│  ├─ events/ · gallery/ · committee/   Section image folders (gitkeep'd until filled)
│  └─ favicon.ico
└─ scripts/
   ├─ generate-assets.mjs   Draws the placeholder favicon/og-image in-palette
   ├─ generate-moments.mjs  Generates placeholder carousel photos
   └─ import-hero-sketch.mjs Restores the p5 hero sketch from the original playground file
```

The `components/landingpage` rule is deliberate: every future page gets its own
`components/<page>/` folder, so the tree stays flat and navigable.

## Palette

Fixed light theme — there is no dark mode.

| Token | Value | Usage |
| --- | --- | --- |
| `--bg` | `#ffffff` | page background |
| `--bg-tint` | `rgba(4,27,59,.035)` | alternating sections, footer |
| `--black` | `#000000` | body copy |
| `--navy` | `#041b3b` | headings, wordmark |
| `--blue` | `#0374df` | accents — buttons, links, borders, hover |
| `--text-muted` | `rgba(4,27,59,.68)` | secondary copy |
| `--border` | `rgba(4,27,59,.14)` | hairlines |

## Placeholder content to replace

| Item | Where |
| --- | --- |
| Real event photos for the carousel | drop into `public/moments/`, keep the `moment-0*` names |
| Real MOSAIC photo | `public/events/mosaic.png` (mirrored as `public/moments/moment-01.png`) |
| Committee names/roles | `components/landingpage/Committee.tsx` |
| MOSAIC date & venue | `components/landingpage/Events.tsx` |
| Branded social card | `public/landingpage/og-image.png` (1200×630) |

Roadmap and future ideas live in [future-scope.md](./future-scope.md).

---

🤖 Generated with Codebuff
