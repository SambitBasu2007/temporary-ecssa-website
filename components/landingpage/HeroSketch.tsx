/**
 * HeroSketch — intentionally empty for now.
 *
 * This component used to run the interactive p5 background sketch ("CS &
 * Circuit Brush") inside the hero, behind the copy. It has been disabled at
 * the owner's request; the hero renders as a plain blank section instead, and
 * nothing imports this file anymore.
 *
 * What this component used to do:
 *   - rendered <div className="hero-sketch" aria-hidden="true" /> — an
 *     absolutely-positioned layer (see HeroSketch.css) under the hero copy
 *   - skipped entirely under `prefers-reduced-motion`
 *   - lazily imported p5 and the ported engine, then called
 *       mountHeroSketch(host, p5)
 *     on mount, keeping the returned teardown for unmount — so p5's weight
 *     never landed in the initial bundle
 *   - decoration only: if the sketch failed to start, the hero still rendered
 *
 * To restore the sketch:
 *   1. Regenerate the engine from the original standalone p5 page:
 *        node scripts/import-hero-sketch.mjs "<path to the playground index.html>"
 *      (rewrites lib/hero-sketch.ts verbatim; fails loudly if the source moved)
 *   2. Recreate this component as described above and add back, in Hero.tsx:
 *        import HeroSketch from "./HeroSketch";
 *      plus <HeroSketch /> as the first child of the <section className="hero">.
 *   3. `p5` and `@types/p5` are still declared in package.json, so no install
 *      step is needed.
 */
export {};
