/**
 * One-off importer: ports the "Ink & Ohm" hero sketch (a standalone p5 page)
 * into this Next.js project as `lib/hero-sketch.ts`.
 *
 *   node scripts/import-hero-sketch.mjs "C:/VS Code/p5-playground-main/copy/index.html"
 *
 * The sketch body is copied verbatim. Only three things are adapted:
 *   1. the drawing surface comes from `mountHeroSketch()` instead of `#hero`
 *   2. the host's pointerleave handler is named so it can be removed on unmount
 *   3. a small mount/unmount API for React is appended
 *
 * Keeping this script around means the port can be re-synced if the original
 * sketch changes — it fails loudly if any expected pattern has moved.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2] ?? "C:/VS Code/p5-playground-main/copy/index.html";

const html = readFileSync(source, "utf8");
const inlineBlocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
if (inlineBlocks.length !== 1) {
  throw new Error(`expected exactly one inline <script> in ${source}, found ${inlineBlocks.length}`);
}

let sketch = inlineBlocks[0][1];
if (!sketch.includes("CS & Circuit Brush") || !sketch.includes("Hero behaviour")) {
  throw new Error("the inline script does not look like the Ink & Ohm hero sketch");
}

const requireMatch = (label, test) => {
  if (!test()) throw new Error(`pattern not found while porting: ${label}`);
};

/* 1. the hero element is handed in by React --------------------------------- */
const hostPattern = /const hero = document\.getElementById\('hero'\);\n(\s*)if \(!hero\) return;/g;
let hostReplacements = 0;
sketch = sketch.replace(hostPattern, (_match, indent) => {
  hostReplacements += 1;
  return `const hero = heroHost();\n${indent}if (!hero) return;`;
});
if (hostReplacements !== 2) {
  throw new Error(`expected 2 #hero lookups, rewrote ${hostReplacements}`);
}
requireMatch("no #hero lookups left", () => !sketch.includes("getElementById('hero')"));

/* 2. the pointerleave handler has to be removable --------------------------- */
const leaveSource = "hero.addEventListener('pointerleave', () => { inside = false; });";
requireMatch("pointerleave handler", () => sketch.includes(leaveSource));
sketch = sketch.replace(leaveSource, "hero.addEventListener('pointerleave', onHostLeave);");

/* 3. de-duplicate shadowed top-level declarations -------------------------
   The standalone page declares some functions twice: the brush engine's
   version first, then the hero's override further down. A <script> allows that
   (the later declaration wins); an ES module does not. Renaming every earlier
   declaration keeps the original resolution exactly — unqualified references
   still land on the last declaration, just as they did in the page. */
// top-level statements in the page's inline script sit at exactly four spaces
const TOP_LEVEL = "^ {4}";
const declaredNames = new Set(
  [...sketch.matchAll(new RegExp(`${TOP_LEVEL}(?:function\\s+(\\w+)|(?:let|const|var)\\s+(\\w+))`, "gm"))].map(
    (match) => match[1] ?? match[2],
  ),
);
const shadowed = new Map();
for (const match of sketch.matchAll(new RegExp(`${TOP_LEVEL}function\\s+(\\w+)\\s*\\(`, "gm"))) {
  const name = match[1];
  const seen = shadowed.get(name);
  if (seen) seen.push(match.index);
  else shadowed.set(name, [match.index]);
}

// collect every rename first, then apply them back-to-front so the offsets
// stay valid while the string changes length
const renames = [];
for (const [name, offsets] of shadowed) {
  if (offsets.length < 2) continue;
  if (offsets.length > 2) throw new Error(`${name} is declared ${offsets.length} times — look at this by hand`);
  let replacement = `${name}Brush`;
  while (declaredNames.has(replacement)) replacement += "X";
  declaredNames.add(replacement);
  renames.push({ offset: offsets[0], name, replacement });
}
if (renames.length === 0) throw new Error("expected the brush/hero shadowing to be present");

renames.sort((a, b) => b.offset - a.offset);
for (const { offset, name, replacement } of renames) {
  const source = `    function ${name}(`;
  if (!sketch.startsWith(source, offset)) throw new Error(`could not rename ${name}`);
  sketch = `${sketch.slice(0, offset)}    function ${replacement}(${sketch.slice(offset + source.length)}`;
}
const renamed = renames.map(({ name, replacement }) => `${name} -> ${replacement}`).sort();

/* 4. React mount API ------------------------------------------------------- */
const api = `

/* ======================================================================
   React mount API — added when this sketch was ported into the ECSSA site.

   Everything above is the original brush engine and hero behaviour, unchanged.
   p5 runs in global mode (\`new p5()\` with no sketch argument), which is what
   makes the bare createCanvas / random / millis / width / height calls above
   resolve, exactly as they did on the standalone page.

   Only the lifecycle hooks the hero actually uses are exposed to p5:
   \`setup\`, \`draw\` and \`windowResized\`. The original's neutralised
   mousePressed / mouseDragged / mouseReleased / keyPressed stubs are left
   out on purpose — p5 calls preventDefault() when those return false, which
   would swallow scrolling and keyboard focus on a real page.
   ====================================================================== */

let p5Instance = null;
let hostEl = null;

/** The hero element this sketch draws into (set by mountHeroSketch). */
function heroHost() {
  return hostEl;
}

/** pointerleave on the host: the pointer is no longer over the hero. */
function onHostLeave() {
  inside = false;
}

/**
 * Start the sketch inside \`host\` and return its teardown function.
 * \`p5Ctor\` is the p5 constructor (imported lazily so p5 stays out of the
 * initial bundle).
 */
export function mountHeroSketch(host, p5Ctor) {
  unmountHeroSketch();

  hostEl = host;
  window.setup = setup;
  window.draw = draw;
  window.windowResized = windowResized;

  p5Instance = new p5Ctor();

  return unmountHeroSketch;
}

/** Remove the canvas, the listeners and every bit of state this sketch holds. */
export function unmountHeroSketch() {
  window.removeEventListener('pointermove', track);
  window.removeEventListener('touchmove', track);
  if (hostEl) hostEl.removeEventListener('pointerleave', onHostLeave);

  if (p5Instance) {
    try {
      p5Instance.remove();
    } catch (error) {
      console.warn('hero sketch teardown failed', error);
    }
    p5Instance = null;
  }

  delete window.setup;
  delete window.draw;
  delete window.windowResized;

  hostEl = null;
  cvEl = null;
  inside = false;
  mx = -1e4;
  my = -1e4;
  st = null;
  queue = [];
  dying = [];
  branches = [];
  autoPen = null;
  lastAutoNode = null;
  curRefs = {};
  branchNextAt = 0;
}
`;

const renamedNote = renamed.map((entry) => ` *   - ${entry}`).join("\n");

const header = `// @ts-nocheck
/**
 * The hero's interactive background sketch.
 *
 * Verbatim port of the "CS & Circuit Brush" p5 sketch behind
 * http://ink-and-ohm — an automatic pen sweeps the hero drafting figures,
 * hovering/touching draws with the same brush, short branch chains grow off
 * the flow, and every figure fades out about three seconds after it lands.
 *
 * The body below is the original source, unchanged apart from the adaptations
 * made by scripts/import-hero-sketch.mjs: the host element is handed in by
 * React, the pointerleave handler is named so it can be removed, shadowed
 * declarations are renamed (below), and the mount/unmount API is appended.
 * p5 is loaded lazily by components/HeroSketch.tsx.
 *
 * Shadowed brush declarations were renamed (a module forbids redeclaring a
 * function, a <script> allows it), so resolution is unchanged:
${renamedNote}
 *
 * Re-sync with:
 *   node scripts/import-hero-sketch.mjs "<path to the playground index.html>"
 */
`;

mkdirSync(join(root, "lib"), { recursive: true });
writeFileSync(join(root, "lib", "hero-sketch.ts"), `${header}${sketch.trimEnd()}${api}`);
console.log(`wrote lib/hero-sketch.ts from ${source}`);
console.log(`renamed shadowed declarations: ${renamed.join(", ")}`);
