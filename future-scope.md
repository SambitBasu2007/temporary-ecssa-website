# Future Scope

## Hero Sketch (p5)

Currently removed — the hero renders as a plain blank section. `lib/hero-sketch.ts` and
`components/landingpage/HeroSketch.tsx` are kept as comment-only placeholders with full restore
notes; `scripts/import-hero-sketch.mjs` regenerates the engine from the original source.

- Ink colors: the brush is monochrome black by design; a navy/blue ink palette would tie it closer to the brand
- A static first frame for `prefers-reduced-motion` instead of no sketch at all
- Pause the auto pen when the hero scrolls out of view
- Expose the brush controls (size, density, style lock) as a small on-page toolbar

## Animation Libraries
- Framer Motion — scroll reveals, layout animations, page transitions
- GSAP — complex timeline animations, hero effects
- Lenis — smooth scrolling

## CMS Integration
- Events management (Sanity/Contentful)
- Blog/announcements
- Gallery management

## Additional Pages
- /events — full events listing
- /committee — full committee with departments
- /gallery — filterable photo gallery
- /projects — project showcase

## Features
- Dark mode toggle (if needed)
- Newsletter signup
- Contact form with backend
- Event registration system
