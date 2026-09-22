/**
 * lib/hero-sketch.ts — intentionally empty for now.
 *
 * This file held a ~1,700-line verbatim port of the standalone "CS & Circuit
 * Brush" p5 page — the interactive hero background: a pen that auto-drafted
 * circuits, code panels, flowcharts and equations across the hero, and which
 * the visitor could also draw with (pointer tracking on `window`). Figures
 * self-erased about three seconds after they landed.
 *
 * Removed at the owner's request; the hero now renders as a plain blank
 * section. The file was kept (emptied) so the restore path stays one command
 * away and nothing else needed to change shape.
 *
 * What used to live here:
 *   - the brush engine: stroke-node placement, figure drafting (resistors
 *     with values, code panels, +9V rails, graph vertices), fade/erase
 *     timing, resize handling
 *   - a small React integration appended by scripts/import-hero-sketch.mjs:
 *       mountHeroSketch(host, p5Ctor) / unmountHeroSketch()
 *     The canvas was created inside a host element handed in by
 *     HeroSketch.tsx; the pointerleave handler was named so teardown could
 *     remove it; only setup/draw/windowResized were exposed to p5, so p5's
 *     preventDefault() on the neutralised mouse/key stubs could never eat
 *     scrolling or Tab focus.
 *
 * To restore the sketch:
 *   1. node scripts/import-hero-sketch.mjs "<path to the playground index.html>"
 *      Regenerates this file verbatim from the original source (renames the
 *      declarations that page shadowed, hands in the host element) and fails
 *      loudly if the source has moved.
 *   2. Recreate components/landingpage/HeroSketch.tsx and re-add its usage in
 *      Hero.tsx — both carry comment blocks describing their original shape.
 *   3. `p5` and `@types/p5` are still in package.json, so no install needed.
 */
export {};
