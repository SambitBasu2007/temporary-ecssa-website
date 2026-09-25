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
│  ├─ StaggeredMenu/        Reusable GSAP animated side menu with prelayer curtains
│  │  ├─ StaggeredMenu.tsx
│  │  └─ StaggeredMenu.css
│  ├─ mosaicpage/           The /mosaic page's own component + styles
│  └─ landingpage/          All landing-page sections (one folder per page as the site grows)
│     ├─ Header             Sticky translucent header integrated with StaggeredMenu
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

# Architecture & Technical Deep Dive

This section provides an exhaustive technical guide to ECSSA-web: explaining the architectural motivation behind every design choice, the comprehensive technology stack across all source files, and a granular, file-by-file breakdown of every variable, state machine, algorithm, and styling nuance.

---

## 1. Architectural Motivations & Core Philosophy

### 1.1 Four-Color Strict Palette & Fixed Light Theme
The visual identity of ECSSA is anchored strictly to four fundamental colors:
- **Black (`#000000`)**: Primary high-contrast body text.
- **White (`#ffffff`)**: Clean background surface (`--bg`).
- **Navy (`#041b3b`)**: Structural authority — headings, borders, and brand wordmark.
- **Blue (`#0374df`)**: Interactive accents, buttons, hyperlinks, and focus rings.

**Motivation:**
1. **Brand Cohesion:** Hardware engineering and computer science student organizations frequently suffer from cluttered, fragmented visual branding. By constraining all primary and secondary surfaces to these four colors (and mathematical rgba tints of Navy and Blue), the site feels engineered, intentional, and editorial.
2. **Light-Theme Exclusivity:** Dark mode was deliberately excluded to mirror the physical feel of engineering schematics, crisp white breadboards, clean terminal printouts, and technical datasheets.
3. **The MOSAIC Exception:** The only deliberate departure from the 4-color palette is the vibrant fest yellow (`#eee500`) used exclusively for the MOSAIC promotional CTA and its under-construction page, creating maximum visual interruption and excitement.

### 1.2 No Tailwind CSS & Zero UI Component Libraries
The entire application uses **Vanilla CSS** organized into scoped per-component stylesheets alongside global design tokens in [`app/globals.css`](file:///c:/VS%20Code/ECSSA-web/app/globals.css).
- **Motivation:** Utility-first frameworks like Tailwind create heavy abstraction layers, repetitive inline class soups, and make custom WebGL canvases, glitch clip-paths, and complex CSS containing-block work harder to reason about. Pure CSS gives 100% fine-grained control over browser painting, CSS transitions (`cubic-bezier`), hardware-accelerated transforms, and media queries without post-CSS compilation bloat.

### 1.3 Zero Emojis & Icon Consistency
Emojis are strictly prohibited across the codebase. All glyphs are provided by `@phosphor-icons/react` using consistent stroke weights (`regular`, `bold`, and `duotone`).
- **Motivation:** Emojis render inconsistently across Windows, macOS, Android, and Linux, often looking playful or immature. Phosphor icons provide clean, monochrome, vector precision that aligns with technical instrumentation.

### 1.4 Selective Client-Side Hydration ("use client")
Next.js 15 App Router is utilized with a Server-First philosophy:
- Root layouts (`app/layout.tsx`), root composition (`app/page.tsx`), and content blocks (`About.tsx`, `Events.tsx`, `Committee.tsx`, `Footer.tsx`) remain **React Server Components (RSC)** with zero JavaScript sent to the client for their rendering.
- `"use client"` is strictly reserved for interactive boundaries:
  - [`Header.tsx`](file:///c:/VS%20Code/ECSSA-web/components/landingpage/Header.tsx): mobile drawer toggle, scroll-lock, and escape listeners.
  - [`Hero.tsx`](file:///c:/VS%20Code/ECSSA-web/components/landingpage/Hero.tsx): video playback toggle and hit-box interaction.
  - [`ModelViewer.tsx`](file:///c:/VS%20Code/ECSSA-web/components/landingpage/ModelViewer.tsx): dynamic WebGL context lifecycle and DotLottie loader.
  - [`CodeCanvas.tsx`](file:///c:/VS%20Code/ECSSA-web/components/landingpage/CodeCanvas.tsx): 2D Canvas render loop and typewriter state engine.
  - [`Gallery.tsx`](file:///c:/VS%20Code/ECSSA-web/components/landingpage/Gallery.tsx): infinite horizontal scroll repositioning and DOM measurement.
  - [`Reveal.tsx`](file:///c:/VS%20Code/ECSSA-web/components/landingpage/Reveal.tsx): viewport intersection observer.

### 1.5 OGL over Three.js / React Three Fiber
For rendering 3D microcontrollers and hardware in the Electronics domain section, the app uses **`ogl`** (a lightweight WebGL library ~10 KB gzipped) rather than Three.js (~150+ KB) or React Three Fiber:
- **Motivation:** Three.js brings massive overhead and complex scene-graph baggage unnecessary for isolated model inspection. `ogl` provides direct access to raw WebGL primitives, custom GLSL shaders, camera matrices, and buffer attributes with practically zero runtime cost.

### 1.6 Pure 2D Canvas for Code Animation
Instead of embedding heavy syntax highlighters like Prism or Monaco Editor, [`CodeCanvas.tsx`](file:///c:/VS%20Code/ECSSA-web/components/landingpage/CodeCanvas.tsx) renders animated C code snippets onto an HTML5 `<canvas>` element using the 2D Context API:
- **Motivation:** Guarantees locked pixel-perfect layouts, eliminates DOM churn from thousands of span tags, scales cleanly with High-DPI (`window.devicePixelRatio`), and allows custom terminal window chrome with status lights drawn in a single draw call.

### 1.7 Non-Hijacked Infinite Moments Rail
Instead of virtualized slider carousels that hijack pointer touchmove or mousewheel events (which degrade UX on trackpads and mobile devices), [`Gallery.tsx`](file:///c:/VS%20Code/ECSSA-web/components/landingpage/Gallery.tsx) uses a **native horizontal overflow strip** paired with multi-copy wraparound:
- **Motivation:** By placing 5 identical copies of the slides and re-centering the scroll position only when the rail is completely at rest (via `scrollend` or debounce), users maintain native momentum, native fling physics, and keyboard navigation without ever hitting a hard edge.

### 1.8 Accessibility (a11y) & Glitch Screen-Reader Mitigation
The glitch text animations on the MOSAIC buttons use CSS pseudo-elements `::before` and `::after` with `attr(data-text)`.
- **Motivation:** In standard screen-reader implementations, pseudo-element text can be read out multiple times (e.g. "UNDER CONSTRUCTION UNDER CONSTRUCTION UNDER CONSTRUCTION"). The components address this by adding `aria-label="Under Construction"` on the parent element, ensuring assistive technology reads the heading exactly once.
- Furthermore, `prefers-reduced-motion` media queries globally disable animations, collapse transitions, and render static snapshots.

---

## 2. Technology Stack Matrix

| Technology / Library | Version | File(s) Used | Role & Technical Motivation |
| :--- | :--- | :--- | :--- |
| **Next.js** | `^15.5.4` | `app/*`, `next.config.mjs` | App Router, static metadata generation, server components, image optimization pipeline via `<Image />`. |
| **React & React DOM** | `^19.1.0` | `app/*`, `components/*` | Component model, hooks (`useRef`, `useState`, `useEffect`, `useCallback`), DOM hydration control. |
| **TypeScript** | `^5.7.0` | Whole project | Strict type safety across GLB scene models, shader uniforms, matrix math, and DOM events. |
| **OGL** | `^1.0.11` | `ModelViewer.tsx`, `modelScene.ts` | Minimalist WebGL renderer: raw scene graph, GLTFLoader, custom vertex & fragment shaders, camera projection. |
| **GSAP** | `^3.12.7` | `StaggeredMenu.tsx` | High-performance timeline animations: staggered prelayer curtains, item rotation/staggers, rolling toggle text, and rotating plus/cross icon. |
| **@lottiefiles/dotlottie-web** | `^0.80.0` | `ModelViewer.tsx` | Highly compressed vector animations; renders `public/assets/logo.lottie` during GLB model streaming. |
| **@phosphor-icons/react** | `^2.1.10` | `Header`, `Hero`, `Events`, `Gallery`, `Committee`, `Footer` | Consistent iconography across SSR and Client boundaries. |
| **Geist Font (`geist`)** | `^1.3.1` | `app/layout.tsx`, `app/globals.css` | Modern geometric sans-serif font variable injected seamlessly without external Google Font roundtrips. |
| **HTML5 Canvas 2D API** | Native | `CodeCanvas.tsx` | Microsecond-accurate character-by-character typewriter loop, syntax coloring, terminal window chrome rendering. |
| **Intersection Observer API** | Native | `Reveal.tsx`, `ModelViewer.tsx`, `modelScene.ts`, `CodeCanvas.tsx` | Halts off-screen animation frames and WebGL rendering to save CPU/GPU cycles and battery life. |
| **Node.js Native APIs (`zlib`, `fs`, `url`)** | Native | `scripts/generate-assets.mjs` | Pure-JavaScript binary rasterizer, PNG chunk encoder (IHDR, IDAT, IEND, CRC32), and ICO packer with 0 dependencies. |
| **Sharp** | Bundled | `scripts/generate-moments.mjs` | High-performance image processing script for converting SVG templates into mozjpeg carousel placeholders. |

---

## 3. Comprehensive File-by-File Breakdown

```
ecssa-web/
├── app/
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx
│   ├── page.tsx
│   └── mosaic/
│       └── page.tsx
├── components/
│   ├── StaggeredMenu/
│   │   ├── StaggeredMenu.css
│   │   └── StaggeredMenu.tsx
│   ├── landingpage/
│   │   ├── About.css / About.tsx
│   │   ├── CodeCanvas.css / CodeCanvas.tsx
│   │   ├── Committee.css / Committee.tsx
│   │   ├── Domains.css / Domains.tsx
│   │   ├── Events.css / Events.tsx
│   │   ├── Footer.css / Footer.tsx
│   │   ├── Gallery.css / Gallery.tsx
│   │   ├── Header.css / Header.tsx
│   │   ├── Hero.css / Hero.tsx
│   │   ├── HeroSketch.css / HeroSketch.tsx
│   │   ├── ModelViewer.css / ModelViewer.tsx
│   │   ├── Reveal.tsx
│   │   └── modelScene.ts
│   └── mosaicpage/
│       ├── MosaicPage.css
│       └── MosaicPage.tsx
├── lib/
│   └── hero-sketch.ts
├── scripts/
│   ├── generate-assets.mjs
│   ├── generate-moments.mjs
│   └── import-hero-sketch.mjs
├── next.config.mjs
├── package.json
└── tsconfig.json
```

---

### 3.1 App Router Core

#### `app/layout.tsx`
- **Purpose:** Root HTML shell, global typography provider, SEO metadata, and open-graph card orchestrator.
- **Variables & Exports:**
  - `title`, `description`: Canonical meta definitions for the entire website.
  - `metadata: Metadata`: Next.js static metadata object configuring OpenGraph cards (`og:image`, 1200×630), Twitter Summary cards (`summary_large_image`), favicon paths, and site canonical URLs (backed by `NEXT_PUBLIC_SITE_URL` with a `http://localhost:3000` fallback).
  - `viewport: Viewport`: Enforces `themeColor: "#ffffff"` and `colorScheme: "light"`.
  - `RootLayout`: Injects the `GeistSans` CSS font variable and the initial `no-js` class onto `<html>`.
- **Nuances:**
  - **No-JS Strategy:** `<html>` starts with `className="no-js"`. In environments where JavaScript is disabled or fails to load, CSS rules targeting `html.no-js .reveal` immediately reveal all content with opacity 1 and transform none. Once React hydrates, [`Reveal.tsx`](file:///c:/VS%20Code/ECSSA-web/components/landingpage/Reveal.tsx) removes `no-js` so interactive animations take over smoothly.
  - `suppressHydrationWarning`: Prevents React hydration mismatch warnings caused by browser extensions or client-side class manipulation on the `<html>` root.

#### `app/page.tsx`
- **Purpose:** Single-page landing composition root.
- **Architecture:** Zero-JS Server Component that imports and streams the primary landing sections in DOM order:
  - `<Header />`: Sticky navigation and mobile slide-out drawer.
  - `<main>` semantic landmark enclosing:
    - `<Hero />`: Brand introduction and interactive logo.
    - `<About />`: Mission statement, stats, and circuit diagram.
    - `<Domains />`: Electronics 3D viewer and Computer Science terminal canvas.
    - `<Events />`: MOSAIC fest spotlight and upcoming events.
    - `<Gallery />`: Infinite photo rail of student moments.
    - `<Committee />`: Core council leadership team.
  - `<Footer />`: Social links, institutional credentials, and sitemap.

#### `app/globals.css`
- **Purpose:** The global design engine, CSS variable repository, reset stylesheets, layout utilities, and animation keyframes.
- **Design Tokens (`:root`):**
  - `--black: #000000; --white: #ffffff; --navy: #041b3b; --blue: #0374df;`
  - `--bg: var(--white); --bg-tint: rgba(4, 27, 59, 0.035);` (Subtle 3.5% navy wash giving distinct rhythmic contrast between sections).
  - `--backdrop: rgba(4, 27, 59, 0.38);` (Backdrop blur overlay for mobile menu).
  - `--border: rgba(4, 27, 59, 0.14); --border-strong: rgba(4, 27, 59, 0.3);`
  - `--container: 1120px; --gutter: 24px; --header-h: 64px; --radius: 8px;`
  - `--ease: cubic-bezier(0.4, 0, 0.2, 1);` (Standard Material Design acceleration/deceleration curve).
- **Core Rules & Mechanisms:**
  - `html { scroll-behavior: smooth; scroll-padding-top: calc(var(--header-h) + 16px); }`: Offsets in-page anchor links (`#about`, `#domains`) so section titles are never hidden beneath the 64px sticky header.
  - `[data-stagger] > *:nth-child(n)`: Automatic 100ms stepped animation delay for list items entering the viewport.
  - `@media (prefers-reduced-motion: reduce)`: Nuclear accessibility override forcing `animation-duration: 0.001ms !important` and `transition-duration: 0.001ms !important` across all elements.

#### `app/mosaic/page.tsx`
- **Purpose:** Dedicated route for `/mosaic`, the destination when users click "REGISTER FOR MOSAIC".
- **Variables & Exports:**
  - `metadata`: Specific title ("Under Construction | MOSAIC 2026") and description.
  - `viewport`: Sets `themeColor: "#eee500"` to paint the mobile browser status bar in MOSAIC's signature festival yellow.
  - `Page()`: Renders `<MosaicPage />`.

---

### 3.2 Landing Page Components

#### `components/landingpage/Header.tsx` & `Header.css`
- **Purpose:** Accessible sticky navigation bar with desktop direct links and integrated GSAP-powered `StaggeredMenu`.
- **State & Variables:**
  - `NAV_LINKS`: Array of `{ label, href }` linking to `#about`, `#domains`, `#events`, `#gallery`.
  - `JOIN_HREF = "#join"`: Direct link to footer contact points.
  - `MENU_ITEMS: StaggeredMenuItem[]`: Complete menu catalog for the side menu:
    1. About (`#about`)
    2. Domains (`#domains`)
    3. Events (`#events`)
    4. Gallery (`#gallery`)
    5. Join Us (`#join`)
    6. MOSAIC 2026 (`/mosaic`)
  - `SOCIAL_ITEMS: StaggeredMenuSocialItem[]`: Social channels (Instagram, LinkedIn, GitHub).
- **Nuances & Styling:**
  - Replaces the legacy hamburger drawer with the animated `StaggeredMenu` featuring multi-layered prelayer sweeps in `#041b3b` (navy) and `#0374df` (blue).
  - On desktop, `site-nav` includes a right-margin (`5.5rem`) so `Join Us` sits with comfortable breathing room next to the animated `[Menu +]` toggle button, allowing both desktop and mobile users to explore the staggered menu.
  - On mobile (`< 768px`), `site-nav` collapses, leaving the animated `[Menu +]` button as the primary navigation trigger.

#### `components/landingpage/Hero.tsx` & `Hero.css`
- **Purpose:** The above-the-fold introductory stage featuring the interactive logo, tagline, MOSAIC teaser, and quick navigation.
- **State & Variables:**
  - `showVideo`: Boolean toggling between the static wordmark (`logo.png`) and the animated video (`logo.webm`).
- **Functioning & Keyframe Glitch Mechanics:**
  - **Dual-State Logo Box:** Both the `<Image>` and the `<video>` share the exact CSS dimensions (`aspect-ratio: 482 / 476; max-width: 400px; object-fit: contain;`). When clicked, the image seamlessly transforms into a looping, transparent WebM animation without triggering layout shift. An invisible `<button className="hero__logo-btn">` is inset 8px on all sides to provide a clean interactive tap target.
  - **Glitch Effect on "REGISTER FOR MOSAIC":** The button carries a `data-text="REGISTER FOR MOSAIC"` attribute. In CSS:
    - Pseudo-elements `::before` and `::after` read `content: attr(data-text)`.
    - Keyframes `hero-glitch-a` and `hero-glitch-b` run on a 1.9s cycle using `steps(1, end)` to create rapid horizontal slices via `clip-path: inset(top 0 bottom 0)`.
    - `aria-label="REGISTER FOR MOSAIC"` is declared on the anchor tag to prevent screen readers from reading the glitch pseudo-content three times.
  - **Scroll Indicator:** Bottom bouncing arrow (`CaretDown`) using `@keyframes nudge-down` leading directly into `#about`.

#### `components/landingpage/About.tsx` & `About.css`
- **Purpose:** Conveys ECSSA’s charter and quantitative reach across SFIT.
- **Variables & Data Structures:**
  - `STATS`: Array of `{ value, label }` detailing student membership, annual workshops, and project completions.
- **Visual Circuit Graphic:**
  - Features an inline vector graphic (`<svg viewBox="0 0 320 320">`) illustrating PCB traces, IC chip outlines, and circuit solder points styled using CSS design tokens (`var(--navy)` and `var(--blue)`).
  - Uses staggered scroll reveals (`delay={240 + i * 100}`) to cascade the statistics into view as the user scrolls.

#### `components/landingpage/Domains.tsx` & `Domains.css`
- **Purpose:** Showcases the dual nature of ECSSA: Electronics & Embedded Systems on one side, Computer Science & Software Engineering on the other.
- **Variables & Data Structures:**
  - `MODELS: Model3D[]`: Catalog of 3D hardware components:
    1. Arduino Uno (`/assets/arduino_uno_-_low_poly.glb`)
    2. ESP8266 Wi-Fi Module (`/assets/esp8266.glb`)
    3. RAM Module (`/assets/RAM by iPoly3D - obBMPOGYvy.glb`)
    4. Raspberry Pi 3 (`/assets/raspberry_pi_3.glb`)
  - `C_SNIPPETS`: Array of real computer science code implementations in C:
    1. `stack.c`: LIFO stack push and pop operations with bounds checking.
    2. `queue.c`: FIFO array circular queue implementation.
    3. `list.c`: Dynamic memory allocation (`malloc`) and pointer-linked nodes.
    4. `search.c`: Iterative logarithmic $O(\log n)$ binary search.
    5. `bits.c`: Bitwise register masking macros (`SET`, `CLEAR`, `CHECK`) bridging code and hardware registers.
- **Responsive Layout (`.domain-split--flip`):**
  - Uses CSS flex/grid order inversion so that on mobile screens, users always read the text description first, followed by the canvas. On desktop screens, the layout alternates zig-zag fashion (Text Left / Model Right, then Code Left / Text Right).

#### `components/landingpage/ModelViewer.tsx` & `ModelViewer.css`
- **Purpose:** React wrapper managing the 3D WebGL stage, model cycling, dotLottie loader overlay, and user interaction.
- **State & Refs:**
  - `canvasHostRef`: Attaches the WebGL `<canvas>` created by OGL.
  - `lottieHostRef`: Container for the animated vector loading graphic.
  - `index`: Current active model index (0 to 3).
  - `status`: Finite state machine (`"loading" | "ready" | "error"`).
  - `dragRef`: Tracks pointer physics `{ down: boolean, lastX: number, lastY: number, velocity: number }`.
  - `visibleRef`: Intersection status boolean to pause rendering when scrolled out of view.
  - `loadedRef`: Set of string URLs tracking models that have already been fetched and compiled, preventing the loader from flashing on previously seen models.
- **Functioning & Lifecycle:**
  - **Dynamic Stage Initialization:** Dynamically imports [`modelScene.ts`](file:///c:/VS%20Code/ECSSA-web/components/landingpage/modelScene.ts) on client mount, establishing the WebGL context and capturing `show(url)` and `destroy()` handles.
  - **Auto-Cycle Timer:** `setInterval` cycles to the next model every 5000ms, automatically pausing whenever `visibleRef.current` is false or during active user dragging.
  - **DotLottie Integration:** When `status === "loading"`, dynamically imports `@lottiefiles/dotlottie-web` to render `/assets/logo.lottie`, auto-destroying the instance when the GLB has compiled and rendered.

#### `components/landingpage/modelScene.ts`
- **Purpose:** The standalone WebGL engine utilizing `ogl` to render 3D GLB models with custom shaders and touch/mouse orbit physics.
- **Shader Pipeline (Custom GLSL):**
  - **Vertex Shader (`VERTEX`):** Transforms model vertex positions by `modelViewMatrix` and `projectionMatrix`, calculates view direction `vViewDir`, normal vectors via `normalMatrix`, and passes UV coordinates `vUv`.
  - **Fragment Shader (`FRAGMENT`):**
    - Multiplies `uBaseColor` by `texture2D(uTexture, vUv)` when textures exist.
    - **Two-Point Lighting Model:** Calculates a primary key light (`normalize(vec3(0.4, 0.85, 0.75))`) and a soft cool fill light (`normalize(vec3(-0.5, -0.2, 0.6))`). Uses `smoothstep` to softly wrap illumination around curved surfaces without clipping shadows to pure black, preserving the component’s true physical colors.
- **Key Functions & Algorithms:**
  - `worldBounds(root)`: Traverses every mesh in the model, accesses raw Float32 position attribute buffers, multiplies them by the mesh's 4×4 world transformation matrix, and calculates the exact world-space bounding box `[min, max]`.
  - `frameModel(entry)`: Computes the maximum bounding dimension $D = \max(\Delta X, \Delta Y, \Delta Z)$ and calculates a scale factor $S = 2.6 / D$. Offsets position by $-C \times S$ (where $C$ is the bounding box center), automatically normalizing any 3D model regardless of intrinsic size or origin offset so it fits inside the viewport.
  - `patchPrograms(root)`: Walks the GLTF node tree and replaces standard materials with the custom GLSL program, attaching a 1×1 pure white canvas texture fallback (`whiteFallback`) to ensure samplers never crash WebGL on untextured meshes.
  - `loop()`: The `requestAnimationFrame` loop. Applies rotational velocity to `spin.angle`, applies friction decay (`dragRef.current.velocity *= 0.94`), smooths pitch between `[-1.1, 1.1]` radians, and executes `renderer.render({ scene, camera })`.

#### `components/landingpage/CodeCanvas.tsx` & `CodeCanvas.css`
- **Purpose:** Canvas 2D engine rendering high-DPI typewriter-style animated C code snippets with retro terminal window chrome.
- **Timing Engine & Constants:**
  - `CYCLE_MS = 3000`: Total duration target per code snippet.
  - `HOLD_MS = 1100`: Time snippet remains fully typed for comfortable reading.
  - `ERASE_MS = 320`: Fast erasure duration before switching to next snippet.
  - `typeStep(totalChars)`: $\max(1, \text{round}(\frac{\text{totalChars} \times 26}{\text{CYCLE\_MS} - \text{HOLD\_MS}}))$ — dynamically scales typewriter speed so both short and long snippets finish typing in the exact same window.
- **Canvas Rendering Engine:**
  - High-DPI support: Multiplies width and height by `Math.min(window.devicePixelRatio, 2)` and applies `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`.
  - Renders top chrome bar (`height: 34px`) with uppercase file title and 3 window control circles in accent blue and muted gray.
  - Types text line-by-line using font `'Geist Mono'` with `measureText()` for exact character placement.
  - Renders blinking rectangular cursor (`7×14px`) oscillating every 530ms (`now % 530 < 17`).
  - Renders bottom pagination dots indicating snippet progress.
  - Pauses execution entirely via `IntersectionObserver` when scrolled off screen.

#### `components/landingpage/Events.tsx` & `Events.css`
- **Purpose:** Event spotlight card highlighting the upcoming flagship technical festival (MOSAIC 2026).
- **Architecture:** Semantic `<article>` card with optimized Next.js `<Image>` banner, metadata badge ("Technical Fest"), calendar and location icons, and a direct CTA button leading to `#join`.

#### `components/landingpage/Gallery.tsx` & `Gallery.css`
- **Purpose:** Infinite, seamless horizontal photo rail displaying event photographs and student moments.
- **Constants & Math:**
  - `MOMENTS`: Array of photo descriptors `{ image, text }`.
  - `COPY_COUNT = 5`: Five identical copies of the photo array are flattened into `SLIDES`.
  - `MIDDLE_COPY = 2`: The rail initializes centered at the third copy ($index = 2$).
  - `IDLE_DELAY_MS = 160`: Milliseconds of scroll stillness before invisible recentering occurs.
- **The Wraparound Algorithm (`recenter()`):**
  - Measures the width of one full copy (`copyWidthRef`) by calculating the delta between `.gallery__item[0]` and `.gallery__item[MOMENTS.length]`.
  - If a user flings or scrolls the rail past the outer boundaries ($ScrollLeft < copyWidth$ or $ScrollLeft \ge TotalWidth - 2 \times copyWidth$), `recenter()` adjusts `scrollLeft` by $\pm copyWidth$ using `behavior: "instant"`.
  - Because all 5 copies are visually identical, this coordinate teleportation is 100% invisible to the human eye.
  - **No Momentum Stutter:** Crucially, recentering is deferred until the scroll momentum has completely stopped (using the modern `scrollend` DOM event, with a debounced `setTimeout` fallback). This prevents fighting the browser's native touch friction or scroll-snap.

#### `components/landingpage/Committee.tsx` & `Committee.css`
- **Purpose:** Core student committee grid showcasing leadership roles (President, Vice President, Technical Head, Events Head).
- **Architecture:** Unordered list of member cards featuring duotone user avatars (`@phosphor-icons/react`), staggered entry animations via `<Reveal delay={100 + i * 100}>`, and an easter-egg external link.

#### `components/landingpage/Footer.tsx` & `Footer.css`
- **Purpose:** Three-column institutional footer containing college crest, internal quick links, social media channels, and copyright notices.
- **Nuances:** Detects external URLs (`href.startsWith("http")`) to automatically apply `target="_blank"` and `rel="noopener noreferrer"` for security against reverse tabnabbing.

#### `components/landingpage/Reveal.tsx`
- **Purpose:** Lightweight scroll-entrance trigger component wrapping child JSX elements in an intersection observer.
- **Variables & Props:**
  - `tag: RevealTag`: Dynamically renders as `"div" | "li" | "article" | "section" | "p"`.
  - `delay`: Optional delay in milliseconds applied as a CSS custom property `--reveal-delay: ${delay}ms`.
  - `armed`: Boolean state toggling the `.is-revealed` class when intersecting with the viewport threshold (`0.12`) and bottom margin (`rootMargin: "0px 0px -8% 0px"`). Disconnects observer immediately after firing once.

#### `components/landingpage/HeroSketch.tsx` & `lib/hero-sketch.ts`
- **Purpose:** Commented architecture and documentation placeholder for the removed interactive p5.js "Ink & Ohm" background sketch.
- **Historical Context & Removal Motivation:**
  - Originally, the hero section featured an interactive canvas where a p5 brush automatically drafted electrical circuit schematics (resistors, diodes, +9V rails) and algorithmic graphs behind the hero copy.
  - At the association owner's request, this was disabled to keep the hero uncluttered, clean, and focused on the animated logo and MOSAIC announcement.
  - Rather than deleting the code, `lib/hero-sketch.ts` and `HeroSketch.tsx` remain preserved as clean architectural interfaces, and [`scripts/import-hero-sketch.mjs`](file:///c:/VS%20Code/ECSSA-web/scripts/import-hero-sketch.mjs) allows restoring the entire interactive engine in a single command.

---

### 3.3 Shared & Feature Components

#### `components/StaggeredMenu/StaggeredMenu.tsx` & `StaggeredMenu.css`
- **Purpose:** High-performance, GSAP-orchestrated full-screen staggered navigation overlay with multi-colored prelayer curtains and interactive toggle animations.
- **Props & Configuration:**
  - `isFixed?: boolean`: Positions the component fixed over the viewport (`z-index: 40`, `pointer-events: none`).
  - `items: StaggeredMenuItem[]`: Navigation items with `{ label, ariaLabel, link }`.
  - `socialItems?: StaggeredMenuSocialItem[]`: Social channels with `{ label, link }`.
  - `colors?: string[]`: Hex color array for staggered curtain prelayers (`sm-prelayer`).
  - `accentColor?: string`: Accent color applied to item hover, decimal numbering (`01`, `02`), and social titles.
  - `panelBg?: string`, `panelColor?: string`: Custom background and foreground overrides for the panel.
  - `menuButtonColor?: string`, `openMenuButtonColor?: string`: Toggle button color transitions during open/close.
  - `logoUrl?: string`, `logoHref?: string`: Brand logo path in the menu header.
- **Animation Architecture (GSAP):**
  - **Prelayer Curtains:** Slides multiple full-height color slices (`.sm-prelayer`) with staggered durations (`duration: 0.5, ease: 'power4.out', stagger: 0.07`).
  - **Panel & Item Entrance:** Main panel translates in, followed by text labels rising with slight initial rotation (`yPercent: 140 -> 0, rotate: 10 -> 0, stagger: 0.1`) and numbering fading in via CSS variable `--sm-num-opacity`.
  - **Rolling Label Animation:** Button text rolls vertically between "Menu" and "Close" with a multi-cycle sequence using GSAP `yPercent` interpolation.
  - **Rotating Cross Icon:** Micro-animation rotating the plus glyph by 225 degrees (`rotate: 225`) into a close cross.
  - **Accessible UX:** Closes on Escape, locks body overflow while open, closes on click-away, and automatically dismisses the menu on link navigation.

---

### 3.4 Mosaic Festival Page Components

#### `components/mosaicpage/MosaicPage.tsx` & `MosaicPage.css`
- **Purpose:** Full-screen promotional landing page informing visitors that MOSAIC 2026 registration is under active construction.
- **Styling Architecture & StaggeredMenu Integration:**
  - Full-bleed background in festival yellow (`#eee500`) with deep black typography.
  - Features its own dedicated `StaggeredMenu` customized for MOSAIC:
    - **Color Palette:** Black (`#000000`), Dark Gray (`#1e1e1e`), and Festival Yellow (`#eee500`).
    - **Panel Theme:** Deep dark panel (`#0a0a0c`) with white text and glowing `#eee500` yellow accents and numbering.
    - **Navigation Item:** A single dedicated `"Main Page"` link that smoothly routes back to `/`.
    - **Header Integration:** Features the ECSSA crest on the top left linking to `/` and the black `[Menu +]` toggle on the top right.
  - **Glitch Heading:** `h1.mosaic-page__title` carries `data-text="UNDER CONSTRUCTION"` with dual pseudo-elements `::before` and `::after` running `@keyframes mosaic-glitch-a` and `mosaic-glitch-b` on a 1.3s loop with random micro-shifts.
  - High-resolution SVG/PNG fest logo and a high-contrast back-button returning to the landing page.

---

### 3.5 Build Scripts & Asset Generators

#### `scripts/generate-assets.mjs`
- **Purpose:** Completely zero-dependency Node.js script that programmatically draws and encodes binary brand assets:
  - `public/favicon.ico`: 32×32 pixel circuit-node glyph.
  - `public/landingpage/og-image.png`: 1200×630 pixel high-resolution social share card.
- **Technical Nuances & Custom Implementation:**
  - **Custom Software Rasterizer:** Implements 2D drawing routines directly in typed memory (`Uint8Array`): `setPixel`, `fillRect`, `fillCircle`, `strokeCircle`, `drawLine`.
  - **2× Supersampling (SSAA):** Draws shapes at double resolution and box-filters them down to target size, producing anti-aliased, crisp vector-like edges without any external graphics libraries.
  - **Hand-Rolled PNG Encoder:** Builds binary PNG chunks (`IHDR`, `IDAT`, `IEND`) using only Node's built-in `node:zlib.deflateSync` and a custom CRC-32 checksum calculation loop.
  - **Binary ICO Packing:** Formats the resulting 32×32 PNG into a Windows Icon file structure (`ICONDIR` header + `ICONDIRENTRY` struct + raw PNG payload).

#### `scripts/generate-moments.mjs`
- **Purpose:** Generates 6 placeholder 1024×1280 event portrait photos for the Moments carousel using SVG templates and `sharp` image compilation.
- **Palette Control:** Cycles backgrounds through the curated palette (`#041b3b`, `#0374df`, `#0a3a78`) with numbered watermark typography.

#### `scripts/import-hero-sketch.mjs`
- **Purpose:** Automated code ingestion pipeline to re-import and patch the standalone p5.js playground sketch into Next.js.
- **AST/Regex Patching Strategy:**
  1. Parses the source HTML file and isolates the inline `<script>`.
  2. Replaces global `document.getElementById('hero')` lookups with dynamic React host hooks (`heroHost()`).
  3. Renames duplicate/shadowed top-level variable declarations that are valid in script tags but illegal in ES modules.
  4. Wraps the canvas in clean `mountHeroSketch` and `unmountHeroSketch` React lifecycle hooks.

---

### 3.5 Project Configuration Files

#### `next.config.mjs`
- **Configuration:** Defines Next.js runtime settings. Configures `images.remotePatterns` for `picsum.photos` and `fastly.picsum.photos` to support placeholder images while real department event photos are being staged.

#### `tsconfig.json`
- **Configuration:** TypeScript compiler configuration with strict type checking enabled (`strict: true`), incremental builds (`incremental: true`), Next.js plugin integration, and path aliasing (`@/*` pointing directly to the project root).

#### `package.json`
- **Configuration:** Project manifest declaring production dependencies (`ogl`, `geist`, `@lottiefiles/dotlottie-web`, `@phosphor-icons/react`, `next`, `react`, `react-dom`) and development scripts (`npm run dev`, `npm run build`, `npm run typecheck`, `npm run assets`).

---

🤖 Generated with Codebuff
