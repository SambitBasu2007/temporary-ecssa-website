// @ts-nocheck
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
 *   - beginStroke -> beginStrokeBrush
 *   - claim -> claimBrush
 *   - draw -> drawBrush
 *   - keyPressed -> keyPressedBrush
 *   - mouseDragged -> mouseDraggedBrush
 *   - mousePressed -> mousePressedBrush
 *   - mouseReleased -> mouseReleasedBrush
 *   - placeNode -> placeNodeBrush
 *   - refFor -> refForBrush
 *   - setup -> setupBrush
 *   - windowResized -> windowResizedBrush
 *
 * Re-sync with:
 *   node scripts/import-hero-sketch.mjs "<path to the playground index.html>"
 */

    /* ================================================================
       Brush engine — the complete CS &amp; Circuit brush, embedded
       verbatim from the project's brushes/cs/sketch.js.
       ================================================================ */
    // CS & Circuit Brush
    // A p5.js brush that scatters computer-science and electronics notes along
    // each stroke, half and half. Every figure is an independent random pick: a
    // circuit part (a labelled resistor, capacitor, diode, LED, logic gate or IC
    // block with reference designators, values and grounds) or a cs figure (a
    // flowchart box holding a real action word, a typed code panel, an equation,
    // a graph vertex, a linked-list or Turing-tape cell). Nothing latches onto
    // one module for more than a single figure, so a stroke walks randomly
    // between both worlds. Keys 1 / 2 lock a whole stroke to one world.
    //
    // Nodes are snapped to an invisible grid at intervals along the stroke and
    // wired to the previous node. Everything is recorded as primitives (ink runs,
    // text, filled blots) and then drawn in like a pen plotter: lines extend at a
    // fixed speed and text types itself out. The ink is wet: line weight swells
    // and thins, lines bleed a soft halo, ink pools and drips where the pen
    // lands, and specks fly. The lines themselves stay straight and true.
    //
    // Perf: every ink run resamples itself once at record time and bakes each
    // per-segment value (line weight, bleed reach, fibres, grains) into arrays,
    // so drawing never evaluates perlin noise. Ink reveals itself straight into
    // the paint layer, and each frame only draws the pixels the pen has just
    // covered instead of replaying every still-active stroke, which keeps the
    // brush smooth even on very old machines.

    const FONT = 'Menlo, Consolas, "Courier New", monospace';
    const PEN_SPEED = 0.7;   // px per ms the pen travels
    const CHAR_MS = 22;      // ms per typed character
    const W = { heavy: 2.3, reg: 1.25, cable: 1.0, thin: 0.7 }; // line weights (px) at size 1

    // Ink character. Runs are resampled and wobbled once when recorded, so the
    // rough edges are stable from frame to frame.
    const INK = {
      step: 2.5,      // px between resampled points along a run
      wobble: 0,      // px the line itself may wander sideways (0 keeps lines true)
      rag: 1.3,       // px of raggedness on blot outlines
      bleed: 3.8,     // how far ink wicks out, as a multiple of the line weight
      bleedAlpha: 40, // alpha of the innermost bleed layer
      fiber: 0.22,    // chance per segment of a fine fiber wicking sideways
      grain: 0.45,    // chance per segment of a grain of ink caught in the paper
      body: 245,      // alpha of the line itself
      pool: 0.85,     // chance a run pools ink where the pen lands and lifts
      blob: 0.45,     // chance a long run carries pooled blobs along its length
      drip: 0.35,     // chance a pooled blob runs into a drip
      speck: 0.7,     // chance a stamp throws specks
    };

    // bleed halo layers: [width multiple of the line weight, alpha fraction]
    const BLEED_LAYERS = [[1, 0.16], [0.6, 0.38], [0.33, 1]];

    // Dialects: keys 1 / 2 lock a whole stroke to cs or circuit, 0 is random.
    // Unlocked, every placed figure is an independent coin toss between the two
    // worlds, and each cs figure rolls a fresh kind of its own.
    const STYLES = ['cs', 'circuit'];

    // electronics parts and how often each appears on a circuit stroke
    const EL_PARTS = [['resistor', 7], ['capacitor', 6], ['cell', 5], ['inductor', 3], ['diode', 4], ['led', 3], ['gate', 3], ['chip', 3], ['opamp', 2], ['junction', 2]];
    // cs node pools per section kind, and the section lengths
    const CS_POOLS = {
      flow: [['process', 5], ['decision', 4], ['term', 2]],
      graph: [['vertex', 1]],
      data: [['list', 2], ['tape', 1]],
      code: [['codePanel', 1]],
      math: [['mathEq', 1]],
    };
    const SECTION_W = [['flow', 4], ['graph', 3], ['data', 2], ['code', 1], ['math', 3]];
    // kinds that take arrowheads on their incoming links
    const FLOW = new Set(['process', 'decision', 'term', 'list']);
    // short real words drawn inside flowchart boxes, diamonds and terminals
    const FLOW_WORDS = ['if', 'loop', 'call', 'push', 'pop', 'swap', 'sort', 'read', 'parse', 'merge', 'split', 'search', 'print', 'init', 'match', 'build', 'shift'];
    const COND_WORDS = ['x < y', 'a > b', 'i == n', 'r > 0', 'ok ?', 'found', 'empty', 'done', 's % 2', 'hi - lo'];
    const TERM_WORDS = ['start', 'stop', 'end', 'return', 'exit'];
    const VERTEX_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const TAPE_CHARS = ['0', '1', 'a', 'b', '#'];
    const IC_PARTS = ['74LS00', '74LS02', '74LS04', '74LS08', '74LS32', '74LS86', 'CD4069', 'NE555', 'LM358', '7805'];
    const OPAMP_TYPES = ['LM358', 'TL072', 'LM741', 'NE5532'];
    const GATE_QUAL = { and: '&', or: '>=1', xor: '=1', not: '1', nand: '&', nor: '>=1' };
    const VALUE_POOL = {
      resistor: ['1k', '10k', '100k', '47k', '330', '4k7', '1M', '2k2'],
      capacitor: ['10n', '100n', '1u', '10u', '22p', '4n7'],
      inductor: ['1m', '10m', '100u', '47u'],
      diode: ['1N4148'],
      led: ['red'],
      cell: ['1.5V', '9V', '5V', '12V'],
    };
    // real-looking code lines for the code panels (ASCII only, no quotes)
    const CODE_SNIPPETS = [
      ['int n = len(a);', 'for (i = 0; i < n; i++) {', '  if (a[i] > best)', '    best = a[i];', '}', 'return best;'],
      ['def fib(n):', '  if n <= 1:', '    return n', '  return fib(n - 1) + fib(n - 2)'],
      ['int gcd(a, b) {', '  while (b != 0) {', '    t = a % b;', '    a = b; b = t;', '  }', '  return a;', '}'],
      ['sum = 0', 'for i in range(n):', '  sum = sum + a[i]', 'print(sum / n)'],
      ['void sort(int a[]) {', '  for (i = 1; i < n; i++)', '    for (j = i; j > 0; j--)', '      if (a[j] < a[j - 1])', '        swap(a, j);', '}'],
      ['if (x < y) {', '  swap(x, y);', '} else {', '  x = x - y;', '}'],
      ['int hash(char *s) {', '  int h = 0;', '  while (*s)', '    h = h * 31 + *s++;', '  return h;', '}'],
      ['q = (lo + hi) / 2;', 'if (x < a[q]) hi = q - 1;', 'else lo = q + 1;'],
    ];
    // equations for the math lines (monospace-safe glyphs only)
    const MATH_EQS = [
      'x = (-b +- sqrt(b^2 - 4ac)) / 2a',
      'a^2 + b^2 = c^2',
      'E = m c^2',
      'sum(x_i) / n = mean(x)',
      'O(n log n) beats O(n^2)',
      'f(n) = n! / (k! (n - k)!)',
      'v = u + a t',
      'y = m x + c',
      's = 1/2 a t^2',
      'P(A and B) = P(A) P(B)',
      'ln(a b) = ln a + ln b',
    ];

    const BRUSH = {
      name: 'CS & Circuit Brush',
      swatch: false,
      help: [
        ['drag', 'lay out code, math and circuits along the stroke'],
        ['1 2 / 0', 'lock cs / lock circuit / random every figure'],
        ['[ ]', 'brush size   - = density   m mirror'],
        ['space', 'auto-fill page   e eraser'],
        ['c', 'clear   r new grid module'],
        ['s', 'save PNG   h hide this'],
      ],
    };

    let paint;              // finished marks
    let u = 12;             // grid module (the unit everything is built from)
    let bs = 1;             // brush size multiplier
    let density = 1;        // nodes per unit of drag distance
    let styleLock = null;   // one of STYLES, or null for random per stroke
    let mirror = false;     // also stamp everything mirrored across the page centre
    let eraser = false;

    let st = null;          // current stroke state
    let active = [];        // stamps still being drawn in
    let autoDelay = 0;      // ms offset applied to everything created (auto-fill)
    let rec = null;         // primitive list being recorded
    let boxes = [];         // occupied rectangles [x0, y0, x1, y1]: numbers and node bodies

    function setupBrush() {
      createCanvas(windowWidth, windowHeight);
      textFont(FONT);
      paint = makeLayer();
      // index.html?auto starts with a page that drafts itself; add
      // &style=cs|circuit and &mirror to preset the brush
      const params = new URLSearchParams(location.search);
      if (STYLES.includes(params.get('style'))) styleLock = params.get('style');
      if (params.has('mirror')) mirror = true;
      buildHUD(BRUSH);
      updateHUD();
      // a host can report a 0 x 0 window at load and never fire resize again;
      // adopt the real size as soon as one exists, then run auto-fill against
      // the real canvas if the earlier attempt drew into nothing
      setTimeout(() => {
        if (windowWidth > 0 && windowHeight > 0 && (width !== windowWidth || height !== windowHeight)) {
          const zeroStart = width < 1 || height < 1;
          windowResized();
          if (zeroStart && params.has('auto')) autoFill();
        }
      }, 100);
      if (params.has('auto')) autoFill();
    }

    function makeLayer() {
      const g = createGraphics(width, height);
      g.strokeCap(ROUND);
      g.strokeJoin(ROUND);
      g.textFont(FONT);
      return g;
    }

    function windowResizedBrush() {
      // p5 can fire this before the canvas is sized at all (0 x 0) or before
      // setup has made `paint`; ignore those calls.
      if (!paint || windowWidth < 1 || windowHeight < 1) return;
      const old = paint;
      resizeCanvas(windowWidth, windowHeight);
      if (width < 1 || height < 1) return;
      paint = makeLayer();
      paint.image(old, 0, 0);
      // in-progress stamps were revealing into the old layer; restart them clean
      active = [];
      boxes = [];
    }

    function drawBrush() {
      if (!width || !height || !paint) return;
      const now = millis();
      advanceStroke();

      // Finished stamps bake their last marks (text, blots, specks) into the
      // paint layer. Inks were already revealed into paint frame by frame, so a
      // live stroke never has to be redrawn from scratch.
      for (let i = 0; i < active.length; i++) {
        const s = active[i];
        if (now >= s.t0 + s.end) { bakeStamp(s, now); active.splice(i, 1); i--; }
        else revealStamp(s, now);
      }

      background(255);
      image(paint, 0, 0);
      for (const s of active) liveStamp(s, window, now);
      drawBrushCursor();
    }

    // ---------------------------------------------------------------- stroke

    function beginStrokeBrush(x, y) {
      // Keys 1 / 2 hold a whole stroke in one dialect; otherwise each node
      // decides for itself, randomly, which world it belongs to.
      st = { x, y, tx: x, ty: y, pressed: true, travel: 0, nodes: [], refs: {} };
    }

    // A follower chases the cursor, closing a fraction of the gap per substep, so
    // hand jitter is filtered before node positions are sampled.
    function advanceStroke() {
      if (!st) return;
      for (let k = 0; k < 4; k++) {
        const dx = st.tx - st.x, dy = st.ty - st.y;
        const d = sqrt(dx * dx + dy * dy);
        if (d < 0.4) break;
        const step = min(d, max(1.5, d * 0.15));
        strokeTo(st.x + dx / d * step, st.y + dy / d * step);
      }
      if (!st.pressed && dist(st.x, st.y, st.tx, st.ty) < 0.8) endStroke();
    }

    function strokeTo(x, y) {
      if (!st) return;
      const d = dist(st.x, st.y, x, y);
      if (d < 0.3) return;
      if (eraser) {
        paint.erase(); paint.noStroke(); paint.circle(x, y, u * 5 * bs); paint.noErase();
        st.x = x; st.y = y;
        return;
      }
      st.travel += d;
      const spacing = (u * 6 * bs) / density;
      if (st.travel >= spacing) {
        st.travel = 0;
        placeNode(snap(x), snap(y));
      }
      st.x = x; st.y = y;
    }

    function endStroke() {
      if (st && !eraser && !st.nodes.length) placeNode(snap(st.x), snap(st.y)); // a plain click
      st = null;
    }

    function mousePressedBrush(e) {
      if (!onCanvas(e) || mouseY < 0 || mouseY > height) return;
      beginStroke(mouseX, mouseY);
    }
    function mouseDraggedBrush() { if (st) { st.tx = mouseX; st.ty = mouseY; } }
    function mouseReleasedBrush() { if (st) st.pressed = false; }

    // ---------------------------------------------------------------- stamping

    // Place a node on the grid, wire it to the previous node of the stroke, label
    // it and hang decorations off it. Everything goes into `rec`, then `commit`
    // schedules it to draw in. Each node is a fresh random draw: electronics
    // part or cs figure, and the cs figure kind is rolled anew every time.
    function placeNodeBrush(x, y) {
      const prev = st.nodes[st.nodes.length - 1] || null;
      if (prev && dist(prev.x, prev.y, x, y) < u * 2.5 * bs) return;
      const elec = styleLock ? styleLock === 'circuit' : random() < 0.5;
      const kind = elec ? weightedPick(EL_PARTS) : weightedPick(nextSection().pool);
      const n = makeNode(kind, x, y, elec);
      // axis-aligned parts lie along the direction the stroke is travelling
      if (prev) n.o = abs(prev.x - x) >= abs(prev.y - y) ? 'h' : 'v';
      if (n.swap && n.o === 'v') { const t = n.rx; n.rx = n.ry; n.ry = t; }
      if (elec) n.ref = refFor(n);
      rec = [];
      claim([x - n.rx, y - n.ry, x + n.rx, y + n.ry]);
      if (prev) connect(prev, n, elec);
      drawNode(n);
      if (random() < 0.9) label(n, elec);
      decorate(n, prev, elec);
      st.nodes.push(n);
      commit(rec);
    }

    // Give every primitive a start time and duration as if a single pen were
    // drawing them one after another (with a little overlap).
    function commit(prims) {
      if (!prims.length) { rec = null; return; }
      if (random() < INK.speck) {
        const src = prims.find(p => p.k === 'ink');
        if (src) prims.push(specksNear(src.runs[0].pts[0]));
      }
      let cursor = 0, end = 0;
      for (const p of prims) {
        if (p.k === 'ink') p.dur = max(80, p.len / PEN_SPEED);
        else if (p.k === 'text') p.dur = p.s.length * CHAR_MS + 60;
        else if (p.k === 'speck') p.dur = 90;
        else p.dur = 140;
        p.start = cursor;
        cursor += p.dur * 0.8;
        end = max(end, p.start + p.dur);
      }
      const t0 = millis() + autoDelay;
      active.push({ prims, t0, end });
      if (mirror) active.push({ prims: mirrorPrims(prims), t0, end });
      rec = null;
    }

    function mirrorPrims(prims) {
      const mx = width;
      const flip = pts => pts.map(p => [mx - p[0], p[1]]);
      return prims.map(p => {
        const c = { ...p };
        if (p.k === 'ink') {
          c.runs = p.runs.map(r => ({ ...r, pts: flip(r.pts), bakedBlobs: [] }));
          if (p.poly) c.poly = flip(p.poly);
        } else if (p.k === 'text') {
          c.x = mx - p.x;
          c.align = p.align === 'left' ? 'right' : p.align === 'right' ? 'left' : 'center';
          c.rot = -p.rot;
        } else if (p.k === 'speck') {
          c.dots = p.dots.map(d => [mx - d[0], d[1], d[2], d[3]]);
        } else {
          c.pts = flip(p.pts);
          c.cx = mx - p.cx;
        }
        return c;
      });
    }

    // ---------------------------------------------------------------- rendering

    function easeOutBack(q) {
      const c1 = 1.4, c3 = c1 + 1;
      return 1 + c3 * pow(q - 1, 3) + c1 * pow(q - 1, 2);
    }

    // Push one still-active stamp's newly covered ink straight into the paint
    // layer. Only the pixels the pen has covered since the last frame are drawn,
    // so a long live stroke never has to be replayed from scratch.
    function revealStamp(s, now) {
      for (const p of s.prims) {
        if (p.k !== 'ink') continue;
        const q = constrain((now - s.t0 - p.start) / p.dur, 0, 1);
        if (q <= 0) continue;
        const target = q >= 1 ? p.len : q * p.len;
        if (p.baked === undefined) p.baked = 0;
        // the white interior goes into paint before this shape's own outline ink
        if (p.fill && p.poly && !p.filled) {
          paint.noStroke();
          paint.fill(p.fill);
          polyShape(paint, p.poly, true);
          p.filled = true;
        }
        if (target > p.baked) {
          sliceInk(paint, p, p.baked, target);
          p.baked = target;
        }
      }
    }

    // Draw the live parts of a stamp (typed text, popping blots and specks) over
    // the paint layer. Ink is not drawn here; it already lives in paint.
    function liveStamp(s, g, now) {
      for (const p of s.prims) {
        if (p.k === 'ink') continue;
        const q = constrain((now - s.t0 - p.start) / p.dur, 0, 1);
        if (q <= 0) continue;
        if (p.k === 'text') drawText(g, p, q);
        else if (p.k === 'speck') drawSpecks(g, p, q);
        else drawBlot(g, p, q);
      }
    }

    // A stamp is finished: reveal any final ink, then bake the marks that were
    // animating live (text types out, blots pop) at full size.
    function bakeStamp(s, now) {
      revealStamp(s, now);
      for (const p of s.prims) {
        if (p.k === 'ink') continue;
        if (p.k === 'text') drawText(paint, p, 1);
        else if (p.k === 'speck') drawSpecks(paint, p, 1);
        else drawBlot(paint, p, 1);
      }
    }

    // Draw the ink between `from` and `to` px of the prim's pen budget, which
    // may straddle several runs.
    function sliceInk(g, p, from, to) {
      let acc = 0;
      for (const r of p.runs) {
        const s0 = max(0, from - acc);
        const s1 = min(r.len, to - acc);
        if (s1 > s0) sliceRun(g, r, s0, s1, p.w);
        acc += r.len;
        if (to <= acc) break;
      }
    }

    function polyShape(g, pts, closed) {
      g.beginShape();
      for (const v of pts) g.vertex(v[0], v[1]);
      if (closed) g.endShape(CLOSE); else g.endShape();
    }

    // Draw the ink between two positions along one run, straight into paint.
    // Every per-segment value was baked when the run was recorded (run.body,
    // run.bleed[L], run.fb, run.gr), so this is plain strokes with no noise or
    // resampling. Bleeds and grains go down first, the body line over them, then
    // pools, blobs and drips once their part of the run is reached.
    function sliceRun(g, run, s0, s1, w) {
      const pts = run.pts;
      if (s1 <= s0 || run.n < 1) return;
      const a = segAt(run, s0), b = segAt(run, s1);
      // the touched segments, each with the start/end point actually drawn
      const pieces = [];
      for (let i = a; i <= b; i++) {
        const start = max(s0, run.cum[i]);
        const stop = min(s1, run.cum[i] + run.lens[i]);
        if (stop <= start) continue;
        pieces.push({
          i,
          p0: start > run.cum[i] ? ptAt(run, start) : pts[i],
          p1: stop < run.cum[i] + run.lens[i] ? ptAt(run, stop) : pts[i + 1],
          full: start <= run.cum[i] && stop >= run.cum[i] + run.lens[i],
        });
      }
      if (!pieces.length) return;

      g.noFill();
      // soft bleed layers, fading outward, with an uneven wicking edge
      for (let L = 0; L < 3; L++) {
        g.stroke(0, INK.bleedAlpha * BLEED_LAYERS[L][1]);
        const wl = run.bleed[L];
        for (const pc of pieces) {
          g.strokeWeight(w * wl[pc.i]);
          g.line(pc.p0[0], pc.p0[1], pc.p1[0], pc.p1[1]);
        }
      }
      // fibers and grains hang off fully covered segments only, under the line
      for (const pc of pieces) {
        if (!pc.full) continue;
        const ax = pts[pc.i][0], ay = pts[pc.i][1];
        const bx = pts[pc.i + 1][0], by = pts[pc.i + 1][1];
        let nx = -(by - ay), ny = bx - ax;
        const m = sqrt(nx * nx + ny * ny) || 1;
        nx /= m; ny /= m;
        const f = run.fb[pc.i];
        if (f) {
          g.stroke(0, f[2]);
          g.strokeWeight(max(0.35, w * 0.3));
          g.line(bx, by, bx + nx * f[0] * f[1] * w, by + ny * f[0] * f[1] * w);
        }
        const gr = run.gr[pc.i];
        if (gr) {
          g.noStroke();
          g.fill(0, gr[3]);
          g.circle(bx + nx * gr[0] * gr[1] * w, by + ny * gr[0] * gr[1] * w, gr[2] * 2 * sqrt(bs));
        }
      }
      // the body line itself, weight swelling and thinning along the way
      g.stroke(0, INK.body);
      for (const pc of pieces) {
        g.strokeWeight(w * run.body[pc.i]);
        g.line(pc.p0[0], pc.p0[1], pc.p1[0], pc.p1[1]);
      }
      // pooled ink where the pen landed and lifted, plus blobs along the way
      g.noStroke();
      if (run.pool && !run.startDone && s0 <= 0) {
        poolBleed(g, run.seed + 7, pts[0][0], pts[0][1], w * 3);
        g.fill(0, 225);
        g.circle(pts[0][0], pts[0][1], w * 3);
        run.startDone = true;
      }
      for (const bl of run.blobs) {
        const bi = bl[0];
        if (run.cum[bi] > s1 || run.bakedBlobs.includes(bi)) continue;
        run.bakedBlobs.push(bi);
        const size = bl[1], drip = bl[2];
        const [x, y] = pts[bi];
        g.fill(0, 225);
        g.circle(x, y, w * size);
        if (drip > 0) {
          // ink running down the page from the blob, thinning to a bead
          g.stroke(0, 210);
          g.strokeWeight(w * 1.1);
          g.line(x, y, x, y + drip * 0.7);
          g.strokeWeight(w * 0.6);
          g.line(x, y + drip * 0.7, x, y + drip);
          g.noStroke();
          g.circle(x, y + drip, w * 1.6);
        }
      }
      if (run.pool && !run.endDone && s1 >= run.len) {
        poolBleed(g, run.seed + 11, pts[pts.length - 1][0], pts[pts.length - 1][1], w * 2.5);
        g.fill(0, 225);
        g.circle(pts[pts.length - 1][0], pts[pts.length - 1][1], w * 2.5);
        run.endDone = true;
      }
    }

    // The 0-based segment that contains px along a run.
    function segAt(run, px) {
      const cum = run.cum;
      for (let i = 0; i < run.n; i++) if (px < cum[i + 1]) return i;
      return run.n - 1;
    }

    // The interpolated point at px along a run.
    function ptAt(run, px) {
      const i = segAt(run, px);
      const t = (px - run.cum[i]) / run.lens[i];
      const a = run.pts[i], b = run.pts[i + 1];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }

    // Lobed bleed around a pool of ink: a soft disc with a few offset lobes
    // where the paper drank more on one side.
    function poolBleed(g, seed, x, y, d) {
      g.noStroke();
      g.fill(0, 18);
      g.circle(x, y, d * 2.2);
      for (let k = 0; k < 3; k++) {
        const a = noise(seed + k * 3.1) * TWO_PI * 2;
        const r = d * (0.3 + 0.5 * noise(seed + 50 + k * 2.7));
        g.fill(0, 14 + 12 * noise(seed + 80 + k));
        g.circle(x + cos(a) * r, y + sin(a) * r, d * (0.9 + 0.8 * noise(seed + 110 + k * 1.9)));
      }
    }

    function drawSpecks(g, p, q) {
      const sc = q >= 1 ? 1 : easeOutBack(q);
      g.noStroke();
      for (const [x, y, r, a] of p.dots) {
        g.fill(0, a);
        g.circle(x, y, r * 2 * sc);
      }
    }

    // Text types itself out. Partial strings are drawn left-aligned from where
    // the full string would start, so centred labels do not shuffle.
    function drawText(g, p, q) {
      const n = q >= 1 ? p.s.length : ceil(q * p.s.length);
      if (n <= 0) return;
      g.textFont(FONT);
      g.textSize(p.size);
      g.textAlign(LEFT, p.va === 'top' ? TOP : p.va === 'bottom' ? BOTTOM : CENTER);
      const tw = p.tw !== undefined ? p.tw : g.textWidth(p.s);
      const x0 = p.align === 'left' ? 0 : p.align === 'center' ? -tw / 2 : -tw;
      g.push();
      g.translate(p.x, p.y);
      if (p.rot) g.rotate(p.rot);
      const part = p.s.slice(0, n);
      // ink wicking out from the figures: a fuzzy wide pass, then a crisp one
      g.fill(0, 0);
      g.stroke(0, 16);
      g.strokeWeight(max(0.8, p.size * 0.22));
      g.text(part, x0, 0);
      g.stroke(0, 70);
      g.strokeWeight(max(0.6, p.size * 0.1));
      g.fill(0, 245);
      g.text(part, x0, 0);
      g.pop();
    }

    function drawBlot(g, p, q) {
      const sc = q >= 1 ? 1 : easeOutBack(q);
      g.stroke(0, 70);
      g.strokeWeight(2.2);
      g.fill(p.col);
      g.push();
      g.translate(p.cx, p.cy);
      g.scale(sc);
      g.beginShape();
      for (const v of p.pts) g.vertex(v[0] - p.cx, v[1] - p.cy);
      g.endShape(CLOSE);
      g.pop();
    }

    // ---------------------------------------------------------------- helpers

    function weightedPick(pairs) {
      let total = 0;
      for (const p of pairs) total += p[1];
      let r = random(total);
      for (const p of pairs) {
        r -= p[1];
        if (r < 0) return p[0];
      }
      return pairs[pairs.length - 1][0];
    }

    function pick(a) { return a[floor(random(a.length))]; }
    function snap(v) { const s = u * 0.5; return round(v / s) * s; }
    function wt(k) { return W[k] * sqrt(bs); }
    function fs(m = 0.72) { return max(6.5, u * m * bs * 0.92); }
    const _twCache = new Map();
    function measure(s, size) {
      const key = `${size.toFixed(2)}|${s}`;
      const hit = _twCache.get(key);
      if (hit !== undefined) return hit;
      textFont(FONT);
      textSize(size);
      const w = textWidth(s);
      _twCache.set(key, w);
      return w;
    }

    // Every annotation is a random number: a small integer, a two-place decimal
    // or a longer reference number.
    function num() {
      const r = random();
      if (r < 0.3) return String(floor(random(1, 13)));
      if (r < 0.7) return random(1, 30).toFixed(2);
      if (r < 0.85) return random(0, 10).toFixed(1);
      return String(floor(random(100, 1000)));
    }
    function smallNum() { return String(floor(random(1, 13))); }
    function refNum() { return `${floor(random(1, 5))}.${floor(random(1, 5))}`; }

    // Sequential reference designator for a circuit part (R1, C2, U3...).
    function refForBrush(n) {
      const m = { resistor: 'R', capacitor: 'C', inductor: 'L', diode: 'D', led: 'D', cell: 'V', gate: 'U', chip: 'U', opamp: 'U' }[n.kind];
      if (!m) return null;
      const k = (st.refs[m] = (st.refs[m] || 0) + 1);
      return m + k;
    }
    function valueFor(n) {
      const pool = VALUE_POOL[n.kind];
      return pool ? pick(pool) : '';
    }
    // A random cs figure kind: which pool a node draws from. Sections are rolled
    // per figure now, so one flowchart box never forces the next node to match.
    function nextSection() {
      const id = weightedPick(SECTION_W);
      return { id, pool: CS_POOLS[id] };
    }

    // recorders --------------------------------------------------------------

    // A polyline of ink. `dash` = [on, off] splits it into runs; `fill` marks a
    // closed shape that is filled once its outline is complete.
    function ink(pts, w, dash = null, fill = null) {
      if (pts.length < 2) return;
      const runs = dash ? dashRuns(pts, dash) : [mkRun(pts)];
      let len = 0;
      for (const r of runs) len += r.len;
      if (len <= 0) return;
      rec.push({ k: 'ink', runs, w, len, fill, poly: fill ? pts : null });
    }

    function mkRun(raw) {
      const pts = roughen(raw);
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      const run = { pts, len, seed: random(1000), pool: len > u * 1.5 && random() < INK.pool, blobs: [] };
      if (len > u * 3 && random() < INK.blob) {
        const count = floor(random(1, 3));
        for (let k = 0; k < count; k++) {
          const drip = random() < INK.drip ? random(u * 0.8, u * 3) * bs : 0;
          run.blobs.push([floor(random(2, pts.length - 2)), random(2.2, 3.8), drip]);
        }
      }
      prepRun(run);
      return run;
    }

    // Bake every per-segment value of a run into arrays once, so drawing the run
    // is a straight replay: per-segment body and bleed weights, and the fibres
    // and grains that hang off each segment. Called at record time, never again.
    function prepRun(run) {
      const pts = run.pts;
      const n = pts.length - 1;
      run.n = n;
      run.startDone = false;
      run.endDone = false;
      run.bakedBlobs = [];
      if (n <= 0) return;
      const lens = new Array(n), cum = new Array(n + 1);
      cum[0] = 0;
      for (let i = 0; i < n; i++) {
        lens[i] = dist(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
        cum[i + 1] = cum[i] + lens[i];
      }
      const body = new Array(n);
      const bleed = [new Array(n), new Array(n), new Array(n)];
      const fb = new Array(n), gr = new Array(n);
      for (let i = 1; i <= n; i++) {
        body[i - 1] = 0.5 + 1.2 * noise(run.seed + i * 0.2);
        for (let L = 0; L < 3; L++) {
          const slow = pow(noise(run.seed + 40 + i * 0.11), 1.7);
          const fast = noise(run.seed + 60 + i * 0.55);
          const k = 0.15 + 1.3 * slow + 0.6 * fast * slow;
          bleed[L][i - 1] = 1 + INK.bleed * BLEED_LAYERS[L][0] * k;
        }
        if (noise(run.seed + 90 + i * 2.3) > 1 - INK.fiber) {
          const side = noise(run.seed + 130 + i * 1.3) < 0.5 ? -1 : 1;
          const lenMul = INK.bleed * (0.3 + 1.2 * noise(run.seed + 170 + i * 0.9));
          fb[i - 1] = [side, lenMul, 35 + 50 * noise(run.seed + 210 + i * 0.7)];
        }
        if (noise(run.seed + 250 + i * 3.1) > 1 - INK.grain) {
          const side = noise(run.seed + 290 + i * 1.7) < 0.5 ? -1 : 1;
          const offMul = 0.6 + INK.bleed * 0.9 * noise(run.seed + 330 + i * 1.1);
          gr[i - 1] = [side, offMul, 0.25 + 0.55 * noise(run.seed + 370 + i * 0.8), 40 + 90 * noise(run.seed + 410 + i * 0.6)];
        }
      }
      run.body = body;
      run.bleed = bleed;
      run.fb = fb;
      run.gr = gr;
      run.lens = lens;
      run.cum = cum;
    }

    // Resample a polyline every few px so the line weight can wander along it.
    // With INK.wobble > 0 each point is also pushed sideways by a slow noise.
    function roughen(raw) {
      if (raw.length < 2) return raw;
      const dense = [raw[0]];
      for (let i = 1; i < raw.length; i++) {
        const a = raw[i - 1], b = raw[i];
        const L = dist(a[0], a[1], b[0], b[1]);
        const n = max(1, ceil(L / INK.step));
        for (let k = 1; k <= n; k++) dense.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
      }
      if (INK.wobble <= 0) return dense;
      const seed = random(1000);
      const amp = INK.wobble * sqrt(bs);
      const out = [];
      for (let i = 0; i < dense.length; i++) {
        const p0 = dense[max(0, i - 1)], p1 = dense[min(dense.length - 1, i + 1)];
        let tx = p1[0] - p0[0], ty = p1[1] - p0[1];
        const m = sqrt(tx * tx + ty * ty) || 1;
        tx /= m; ty /= m;
        const off = (noise(seed + i * 0.35) - 0.5) * 2 * amp;
        out.push([dense[i][0] - ty * off, dense[i][1] + tx * off]);
      }
      return out;
    }

    // A few flecks of ink thrown around a point.
    function specksNear(pt) {
      const dots = [];
      const n = floor(random(6, 16));
      for (let i = 0; i < n; i++) {
        const a = random(TWO_PI), d = random(u * 0.4, u * 3.5) * bs;
        dots.push([pt[0] + cos(a) * d, pt[1] + sin(a) * d, random(0.4, 2) * sqrt(bs), random(120, 240)]);
      }
      return { k: 'speck', dots };
    }

    function dashRuns(pts, dash) {
      const runs = [];
      let cur = [pts[0]], on = true, rem = dash[0];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const L = dist(a[0], a[1], b[0], b[1]);
        let t = 0;
        while (t < L) {
          const step = min(rem, L - t);
          t += step; rem -= step;
          const p = [lerp(a[0], b[0], t / L), lerp(a[1], b[1], t / L)];
          if (on) cur.push(p);
          if (rem <= 0) {
            if (on) { runs.push(mkRun(cur)); cur = []; }
            else cur = [p];
            on = !on;
            rem = on ? dash[0] : dash[1];
          }
        }
      }
      if (cur.length > 1) runs.push(mkRun(cur));
      return runs;
    }

    function circ(cx, cy, r, w, dash = null, fill = null, a0 = 0, a1 = TWO_PI) {
      const n = max(12, floor(r * abs(a1 - a0) / 3));
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const a = lerp(a0, a1, i / n);
        pts.push([cx + cos(a) * r, cy + sin(a) * r]);
      }
      ink(pts, w, dash, fill);
    }

    function rrectPts(x, y, w, h, rad) {
      rad = min(rad, w / 2, h / 2);
      const pts = [];
      const corners = [[x + w - rad, y + rad, -HALF_PI], [x + w - rad, y + h - rad, 0], [x + rad, y + h - rad, HALF_PI], [x + rad, y + rad, PI]];
      for (const [cx, cy, a0] of corners) {
        for (let i = 0; i <= 6; i++) {
          const a = a0 + HALF_PI * i / 6;
          pts.push([cx + cos(a) * rad, cy + sin(a) * rad]);
        }
      }
      pts.push(pts[0]);
      return pts;
    }
    function rrect(x, y, w, h, rad, wgt, dash = null, fill = null) { ink(rrectPts(x, y, w, h, rad), wgt, dash, fill); }

    // A number that must land clear of everything placed so far: the box is
    // nudged through a few nearby positions and the number is dropped if none
    // is free. Returns the final [x, y] or null.
    function txt(s, x, y, size, align = 'left', va = 'center', rot = 0) {
      const g = u * bs;
      const tries = [[0, 0], [0, -g], [0, g], [g, 0], [-g, 0], [0, -2 * g], [0, 2 * g], [g, -g], [g, g], [-g, -g], [-g, g]];
      for (const [ox, oy] of tries) {
        const b = textBox(s, x + ox, y + oy, size, align, va, rot);
        if (!isFree(b)) continue;
        claim(b);
        txtRaw(s, x + ox, y + oy, size, align, va, rot);
        return [x + ox, y + oy];
      }
      return null;
    }

    // A number drawn exactly where asked (inside a bubble or marker).
    function txtRaw(s, x, y, size, align = 'left', va = 'center', rot = 0) {
      rec.push({ k: 'text', s, x, y, size, align, va, rot, tw: measure(s, size) });
    }

    // Padded bounding box of a number in page coordinates.
    function textBox(s, x, y, size, align, va, rot) {
      const w = measure(s, size), h = size;
      const lx = align === 'left' ? 0 : align === 'center' ? -w / 2 : -w;
      const ly = va === 'top' ? 0 : va === 'center' ? -h / 2 : -h;
      const c = cos(rot), sn = sin(rot);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [px, py] of [[lx, ly], [lx + w, ly], [lx, ly + h], [lx + w, ly + h]]) {
        const wx = x + px * c - py * sn, wy = y + px * sn + py * c;
        x0 = min(x0, wx); y0 = min(y0, wy); x1 = max(x1, wx); y1 = max(y1, wy);
      }
      const pad = u * 0.22 * bs;
      return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
    }

    function isFree(b) {
      for (const o of boxes) if (b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]) return false;
      return true;
    }

    function claimBrush(b) {
      boxes.push(b);
      if (mirror) boxes.push([width - b[2], b[1], width - b[0], b[3]]);
    }

    function blot(raw, col = '#000') {
      let cx = 0, cy = 0;
      for (const p of raw) { cx += p[0]; cy += p[1]; }
      cx /= raw.length; cy /= raw.length;
      // rag the outline: each vertex wanders a little in and out from the centre
      const amp = INK.rag * sqrt(bs);
      const pts = raw.map(([x, y]) => {
        const dx = x - cx, dy = y - cy;
        const m = sqrt(dx * dx + dy * dy) || 1;
        const off = (random() - 0.5) * 2 * amp;
        return [x + dx / m * off, y + dy / m * off];
      });
      rec.push({ k: 'blot', pts, cx, cy, col });
    }
    function dotBlot(x, y, r) {
      const pts = [];
      for (let i = 0; i < 14; i++) pts.push([x + cos(i / 14 * TWO_PI) * r, y + sin(i / 14 * TWO_PI) * r]);
      blot(pts);
    }

    function bezierPts(x1, y1, cx1, cy1, cx2, cy2, x2, y2, n = 40) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        pts.push([bezierPoint(x1, cx1, cx2, x2, t), bezierPoint(y1, cy1, cy2, y2, t)]);
      }
      return pts;
    }

    // ---------------------------------------------------------------- nodes

    function makeNode(kind, x, y, elec) {
      const n = { x, y, kind, o: 'h', swap: false, r: u * random(0.8, 1.1) * bs };
      if (kind === 'process') { n.rx = u * random(1.7, 2.2) * bs; n.ry = u * random(0.7, 0.95) * bs; }
      else if (kind === 'decision') { n.rx = u * random(1.6, 2.0) * bs; n.ry = n.rx * 0.85; }
      else if (kind === 'term') { n.rx = u * random(1.2, 1.6) * bs; n.ry = u * 0.72 * bs; }
      else if (kind === 'vertex') { n.r = u * random(0.65, 0.95) * bs; n.rx = n.r * 1.9; n.ry = n.r * 1.7; }
      else if (kind === 'list') { n.rx = u * random(1.5, 1.8) * bs; n.ry = u * 0.8 * bs; }
      else if (kind === 'tape') { n.r = u * 0.95 * bs; n.rx = n.r * 1.05; n.ry = n.r * 1.5; }
      else if (kind === 'codePanel' || kind === 'mathEq') {
        // a text figure: size its box from the widest line of real content
        const s = fs(kind === 'codePanel' ? 0.46 : 0.6);
        n.lines = kind === 'codePanel' ? pick(CODE_SNIPPETS) : [pick(MATH_EQS)];
        n.ms = s;
        let mw = 0;
        for (const ln of n.lines) mw = max(mw, measure(ln, s));
        if (kind === 'codePanel') {
          n.lh = s * 1.55;
          const ch = ((n.lines.length - 1) * n.lh + s) / 2; // content half height
          n.rx = mw / 2 + u * 1.0 * bs;
          n.ry = ch + u * 0.45 * bs;
        } else {
          n.rx = mw / 2 + u * 1.15 * bs;
          n.ry = s * 1.7 + u * 0.4 * bs;
        }
      }
      else if (kind === 'resistor' || kind === 'inductor' || kind === 'diode' || kind === 'led' || kind === 'cell' || kind === 'capacitor') {
        n.swap = true;
        n.ah = u * random(1.05, 1.25) * bs;  // half length along the trace
        n.rx = n.ah; n.ry = u * 0.62 * bs;
      }
      else if (kind === 'gate') { n.ah = u * 1.5 * bs; n.rx = n.ah; n.ry = u * 0.82 * bs; }
      else if (kind === 'opamp') { n.ah = u * 1.8 * bs; n.rx = n.ah; n.ry = u * 1.2 * bs; }
      else if (kind === 'chip') { n.ah = u * 2.2 * bs; n.rx = n.ah; n.ry = u * 1.05 * bs; }
      else if (kind === 'junction') { n.rx = u * 0.7 * bs; n.ry = u * 0.7 * bs; n.r = u * 0.28 * bs; }
      if (n.rx === undefined) { n.rx = n.r; n.ry = n.r; }
      if (n.ah === undefined) n.ah = max(n.rx, n.ry);
      return n;
    }

    function drawNode(n) {
      switch (n.kind) {
        case 'process': nodeProcess(n); break;
        case 'decision': nodeDecision(n); break;
        case 'term': nodeTerm(n); break;
        case 'vertex': nodeVertex(n); break;
        case 'list': nodeList(n); break;
        case 'tape': nodeTape(n); break;
        case 'codePanel': nodeCode(n); break;
        case 'mathEq': nodeMath(n); break;
        case 'resistor': case 'capacitor': case 'inductor': case 'diode': case 'led': case 'cell': twoTerm(n); break;
        case 'gate': nodeGate(n); break;
        case 'chip': nodeChip(n); break;
        case 'opamp': nodeOpamp(n); break;
        case 'junction': nodeJunction(n); break;
      }
    }

    // Rotate a shape built horizontally so it stands upright along the trace.
    function lay(n, pts) {
      if (n.o !== 'v') return pts;
      const { x, y } = n;
      return pts.map(p => [x - (p[1] - y), y + (p[0] - x)]);
    }
    function layInk(n, pts, w, dash = null, fill = null) { ink(lay(n, pts), w, dash, fill); }

    // Straight lead stubs at both ends of a two-terminal part.
    function lead(n, half) {
      layInk(n, [[n.x - half, n.y], [n.x - n.ah, n.y]], wt('reg'));
      layInk(n, [[n.x + n.ah, n.y], [n.x + half, n.y]], wt('reg'));
    }

    // Flowchart process box holding a real action word.
    function nodeProcess(n) {
      const { x, y, rx, ry } = n;
      rrect(x - rx, y - ry, rx * 2, ry * 2, u * 0.22 * bs, wt('reg'), null, '#fff');
      txtRaw(pick(FLOW_WORDS), x, y, fs(0.52), 'center', 'center');
    }

    // Decision diamond holding a real comparison.
    function nodeDecision(n) {
      const { x, y, rx, ry } = n;
      ink([[x, y - ry], [x + rx, y], [x, y + ry], [x - rx, y], [x, y - ry]], wt('reg'), null, '#fff');
      txtRaw(pick(COND_WORDS), x, y, fs(0.46), 'center', 'center');
    }

    // Start / stop terminal holding a real word.
    function nodeTerm(n) {
      const { x, y, rx, ry } = n;
      rrect(x - rx, y - ry, rx * 2, ry * 2, ry, wt('reg'), null, '#fff');
      txtRaw(pick(TERM_WORDS), x, y, fs(0.5), 'center', 'center');
    }

    // Graph vertex: a circle holding a name, sometimes with a dashed ring.
    function nodeVertex(n) {
      const { x, y, r } = n;
      circ(x, y, r, wt('reg'), null, '#fff');
      txtRaw(pick(VERTEX_NAMES), x, y, fs(0.52), 'center', 'center');
      if (random() < 0.3) circ(x, y, r * 1.5, wt('thin'), [u * 0.3 * bs, u * 0.25 * bs]);
    }

    // Linked-list cell: a value with a pointer arrow into the next cell.
    function nodeList(n) {
      const { x, y, rx, ry } = n;
      ink([[x - rx, y - ry], [x + rx, y - ry], [x + rx, y + ry], [x - rx, y + ry], [x - rx, y - ry]], wt('reg'), null, '#fff');
      ink([[x, y - ry + u * 0.12 * bs], [x, y + ry - u * 0.12 * bs]], wt('thin'));
      txtRaw(smallNum(), x - rx * 0.45, y, fs(0.5), 'center', 'center');
      const ax = x + rx * 0.4, bx = x + rx * 0.76;
      ink([[ax, y], [bx, y]], wt('thin'));
      blot([[bx + u * 0.16 * bs, y], [bx - u * 0.06 * bs, y - u * 0.15 * bs], [bx - u * 0.06 * bs, y + u * 0.15 * bs]]);
    }

    // Turing tape cell with a symbol and its read/write head above.
    function nodeTape(n) {
      const { x, y, r } = n;
      ink([[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r], [x - r, y - r]], wt('reg'), null, '#fff');
      txtRaw(pick(TAPE_CHARS), x, y, fs(0.5), 'center', 'center');
      ink([[x, y - r * 1.3], [x, y - r * 0.7]], wt('thin'));
      blot([[x, y - r * 0.38], [x - u * 0.18 * bs, y - r * 0.62], [x + u * 0.18 * bs, y - r * 0.62]]);
    }

    // A panel of real code lines, like a small editor window.
    function nodeCode(n) {
      const { x, y, rx, ry, ms, lh, lines } = n;
      rrect(x - rx, y - ry, rx * 2, ry * 2, u * 0.2 * bs, wt('reg'), null, '#fff');
      const ch = ((lines.length - 1) * lh + ms) / 2;
      // a thin gutter rule down the left of the panel
      ink([[x - rx + u * 0.62 * bs, y - ry + u * 0.35 * bs], [x - rx + u * 0.62 * bs, y + ry - u * 0.35 * bs]], wt('thin'));
      for (let i = 0; i < lines.length; i++) {
        txtRaw(lines[i], x - rx + u * 1.0 * bs, y - ch + i * lh, ms, 'left', 'top');
      }
    }

    // A displayed equation: centred text, underline, and a number like (7).
    function nodeMath(n) {
      const { x, y, ms } = n;
      const s = n.lines[0];
      const w = measure(s, ms);
      txtRaw(s, x, y, ms, 'center', 'bottom');
      ink([[x - w / 2, y + ms * 0.16], [x + w / 2, y + ms * 0.16]], wt('thin'));
      txtRaw('(' + smallNum() + ')', x + w / 2 + u * 0.5 * bs, y, fs(0.45), 'right', 'bottom');
    }

    // Two-terminal parts (resistor / capacitor / inductor / diode / LED / cell):
    // leads that meet the trace, then the symbol itself between them.
    function twoTerm(n) {
      const { x, y } = n;
      const a = n.ah - u * 0.3 * bs; // symbol half length; leads fill the rest
      if (n.kind === 'resistor') {
        lead(n, a);
        const pts = [[x - a, y]];
        for (let i = 1; i < 9; i++) {
          const t = i / 9;
          pts.push([x - a + 2 * a * t, y + (i % 2 ? -1 : 1) * u * 0.3 * bs]);
        }
        pts.push([x + a, y]);
        layInk(n, pts, wt('reg'));
      } else if (n.kind === 'inductor') {
        lead(n, a);
        const rr = a / 3;
        const pts = [[x - a, y]];
        for (let i = 0; i < 3; i++) {
          const cxi = x - a + rr * (2 * i + 1);
          for (let k = 0; k <= 12; k++) {
            const th = PI * (1 - k / 12);
            pts.push([cxi + cos(th) * rr, y - sin(th) * rr * 0.9]);
          }
        }
        pts.push([x + a, y]);
        layInk(n, pts, wt('reg'));
      } else if (n.kind === 'capacitor') {
        const h = u * 0.42 * bs;
        lead(n, u * 0.35 * bs);
        layInk(n, [[x - u * 0.24 * bs, y - h], [x - u * 0.24 * bs, y + h]], wt('reg'));
        layInk(n, [[x + u * 0.24 * bs, y - h], [x + u * 0.24 * bs, y + h]], wt('reg'));
      } else if (n.kind === 'diode' || n.kind === 'led') {
        const h = u * 0.42 * bs;
        lead(n, u * 0.62 * bs);
        layInk(n, [[x - u * 0.55 * bs, y - h], [x - u * 0.55 * bs, y + h], [x + u * 0.1 * bs, y]], wt('reg'));
        layInk(n, [[x + u * 0.3 * bs, y - h], [x + u * 0.3 * bs, y + h]], wt('reg'));
        if (n.kind === 'led') {
          layInk(n, [[x + u * 0.5 * bs, y - u * 0.55 * bs], [x + u * 0.66 * bs, y - u * 0.71 * bs]], wt('thin'));
          layInk(n, [[x + u * 0.5 * bs, y + u * 0.55 * bs], [x + u * 0.66 * bs, y + u * 0.71 * bs]], wt('thin'));
        }
      } else if (n.kind === 'cell') {
        const h = u * 0.4 * bs;
        lead(n, u * 0.42 * bs);
        layInk(n, [[x - u * 0.3 * bs, y - h * 1.15], [x - u * 0.3 * bs, y + h * 1.15]], wt('thin'));
        layInk(n, [[x + u * 0.16 * bs, y - h * 0.8], [x + u * 0.16 * bs, y + h * 0.8]], wt('reg'));
      }
    }

    // IEC logic gate drawn as a box: qualifier inside, A / B in, Y out, bubble
    // when negated. Reads cleanly at small sizes.
    function nodeGate(n) {
      const kind = pick(['and', 'and', 'or', 'or', 'nand', 'nor', 'not', 'xor']);
      const neg = kind === 'nand' || kind === 'nor' || kind === 'not';
      const { x, y, ah, ry } = n;
      const bw = ah - u * 0.42 * bs, bh = ry - u * 0.18 * bs;
      rrect(x - bw, y - bh, bw * 2, bh * 2, u * 0.14 * bs, wt('reg'), null, '#fff');
      txtRaw(GATE_QUAL[kind], x, y, fs(0.58), 'center', 'center');
      const inCount = kind === 'not' ? 1 : 2;
      for (let i = 0; i < inCount; i++) {
        const yy = y + (i - (inCount - 1) / 2) * bh * 0.9;
        ink([[x - bw - u * 0.34 * bs, yy], [x - bw, yy]], wt('reg'));
        txtRaw(i === 0 && inCount === 2 ? 'A' : 'B', x - bw * 0.5, yy, fs(0.34), 'center', 'center');
      }
      // output pin, bubble if negated
      ink([[x + bw, y], [x + bw + u * 0.55 * bs, y]], wt('reg'));
      if (neg) circ(x + bw + u * 0.18 * bs, y, u * 0.17 * bs, wt('reg'), null, '#fff');
      txtRaw('Y', x + bw + u * 0.66 * bs, y, fs(0.34), 'center', 'center');
    }

    // IC block: a labelled chip with pins on both sides.
    function nodeChip(n) {
      const { x, y, ah, ry } = n;
      const bw = ah - u * 0.55 * bs, bh = ry - u * 0.15 * bs;
      rrect(x - bw, y - bh, bw * 2, bh * 2, u * 0.15 * bs, wt('reg'), null, '#fff');
      txtRaw(pick(IC_PARTS), x, y, fs(0.55), 'center', 'center');
      const k = floor(random(2, 4));
      for (let i = 0; i < k; i++) {
        const yy = y - bh * 0.8 + i * (bh * 1.6) / (k - 1);
        ink([[x - bw, yy], [x - ah, yy]], wt('thin'));
        ink([[x + bw, yy], [x + ah, yy]], wt('thin'));
      }
      dotBlot(x - bw + u * 0.3 * bs, y - bh + u * 0.3 * bs, u * 0.09 * bs);
    }

    // Op-amp: triangle with + and - inputs and an output pin.
    function nodeOpamp(n) {
      const { x, y, ah, ry } = n;
      const bw = ah - u * 0.5 * bs, bh = ry - u * 0.3 * bs;
      ink([[x - bw, y - bh], [x - bw, y + bh], [x + bw, y], [x - bw, y - bh]], wt('reg'), null, '#fff');
      ink([[x - bw - u * 0.42 * bs, y - bh * 0.5], [x - bw, y - bh * 0.5]], wt('reg'));
      ink([[x - bw - u * 0.42 * bs, y + bh * 0.5], [x - bw, y + bh * 0.5]], wt('reg'));
      ink([[x + bw, y], [x + ah, y]], wt('reg'));
      txtRaw('-', x - bw * 0.3, y - bh * 0.55, fs(0.5), 'center', 'center');
      txtRaw('+', x - bw * 0.3, y + bh * 0.52, fs(0.5), 'center', 'center');
      txtRaw(pick(OPAMP_TYPES), x, y + bh * 0.62, fs(0.34), 'center', 'center');
    }

    // A junction node: a ring holding a solder dot, where a net taps off.
    function nodeJunction(n) {
      const { x, y } = n;
      circ(x, y, u * 0.5 * bs, wt('reg'), null, '#fff');
      dotBlot(x, y, u * 0.17 * bs);
    }

    // ---------------------------------------------------------------- wiring

    function connect(a, b, elec) {
      if (!elec) {
        // cs links: straight or gently routed, with arrowheads into flow nodes
        const L = dist(a.x, a.y, b.x, b.y);
        const arrow = FLOW.has(b.kind);
        const p = [[a.x, a.y], [b.x, b.y]];
        if (L < u * 3 * bs) { ink(p, wt('reg')); if (arrow) arrowEnd(p); return; }
        const r = random();
        if (r < 0.55) {
          ink(p, wt('reg'));
          if (arrow && random() < 0.85) arrowEnd(p);
        } else if (r < 0.8) {
          const q = orthoPts(a, b);
          ink(q, wt('thin'));
          if (arrow && random() < 0.5) arrowEnd(q);
        } else {
          ink(p, wt('reg'), [u * 0.6 * bs, u * 0.4 * bs]);
        }
        return;
      }
      // circuit traces run from the rim of one part to the rim of the next,
      // so wires never cross the bodies of the inline components
      const pa = rimPt(a, b), pb = rimPt(b, a);
      const span = dist(pa[0], pa[1], pb[0], pb[1]);
      if (span < u * 1.2 * bs) return;
      const dx = pb[0] - pa[0], dy = pb[1] - pa[1];
      const aligned = abs(dx) < u * 0.7 * bs || abs(dy) < u * 0.7 * bs;
      const r = random();
      if (aligned || r < 0.5) {
        ink([pa, pb], wt('reg'));
      } else if (r < 0.85) {
        const pts = random() < 0.5 ? [pa, [pb[0], pa[1]], pb] : [pa, [pa[0], pb[1]], pb];
        ink(pts, wt('reg'));
        for (let i = 1; i < pts.length - 1; i++) dotBlot(pts[i][0], pts[i][1], u * 0.13 * bs);
      } else {
        const mx = snap(lerp(pa[0], pb[0], 0.5));
        ink([pa, [mx, pa[1]], [mx, pb[1]], pb], wt('reg'), [u * 0.7 * bs, u * 0.45 * bs]);
      }
    }

    // Orthogonal route (a list of bend points) between two node centres.
    function orthoPts(a, b) {
      const r = random();
      if (r < 0.4) return [[a.x, a.y], [b.x, a.y], [b.x, b.y]];
      if (r < 0.8) return [[a.x, a.y], [a.x, b.y], [b.x, b.y]];
      const mx = snap(lerp(a.x, b.x, 0.5));
      return [[a.x, a.y], [mx, a.y], [mx, b.y], [b.x, b.y]];
    }

    // For axis-aligned parts the trace attaches at the outer lead tip, so wires
    // never run through the symbol itself; blocks attach near their pin tips.
    function rimPt(n, t) {
      const dx = t.x - n.x, dy = t.y - n.y;
      const sx = dx >= 0 ? 1 : -1, sy = dy >= 0 ? 1 : -1;
      if (n.kind === 'junction') return [n.x, n.y];
      if (n.swap) {
        if (abs(dx) >= abs(dy)) return [n.x + sx * n.ah, n.y];
        return [n.x, n.y + sy * n.ah];
      }
      if (abs(dx) >= abs(dy)) return [n.x + sx * (n.ah - u * 0.1 * bs), n.y];
      return [n.x, n.y + sy * max(n.ry - u * 0.1 * bs, u * 0.3 * bs)];
    }

    // A small ink arrowhead at the end of a polyline, pointing along its last
    // segment (used on links into flow nodes).
    function arrowEnd(pts) {
      const p = pts[pts.length - 2], q = pts[pts.length - 1];
      let dx = q[0] - p[0], dy = q[1] - p[1];
      const L = dist(p[0], p[1], q[0], q[1]) || 1;
      if (L < u * 1.2) return;
      dx /= L; dy /= L;
      const tip = [q[0] - dx * u * 0.55 * bs, q[1] - dy * u * 0.55 * bs];
      const bx = tip[0] - dx * u * 0.4 * bs, by = tip[1] - dy * u * 0.4 * bs;
      const hw = u * 0.22 * bs;
      blot([[tip[0], tip[1]], [bx + dy * hw, by - dx * hw], [bx - dy * hw, by + dx * hw]]);
    }

    // ---------------------------------------------------------------- labels

    const REF_KINDS = new Set(['resistor', 'capacitor', 'inductor', 'diode', 'led', 'cell', 'gate', 'chip', 'opamp']);

    function label(n, elec) {
      if (elec) {
        // reference designator (R1, C2, V1...) underlined above the part, and a
        // value printed under parts that lie flat on the trace
        if (!REF_KINDS.has(n.kind) || !n.ref) return;
        const size = fs(0.5);
        const p = txt(n.ref, n.x, n.y - n.ry - u * 0.42 * bs, size, 'center', 'bottom');
        if (!p) return;
        const tw = measure(n.ref, size);
        ink([[p[0] - tw / 2, p[1] + u * 0.12 * bs], [p[0] + tw / 2, p[1] + u * 0.12 * bs]], wt('thin'));
        if (n.swap && n.o === 'h' && n.kind !== 'gate' && n.kind !== 'chip' && n.kind !== 'opamp' && n.kind !== 'junction') {
          txt(valueFor(n), n.x, n.y + n.ry + u * 0.55 * bs, fs(0.4), 'center', 'top');
        }
        return;
      }
      // cs figures carry their own real text, so no side labels are needed
    }

    // ---------------------------------------------------------------- decorations

    function decorate(n, prev, elec) {
      if (elec) {
        if (!prev && random() < 0.5 && n.kind !== 'cell') railTop(n);
        if (prev && random() < 0.34 && n.swap && n.o === 'h' && n.kind !== 'cell' && n.kind !== 'led' && n.kind !== 'diode') dropGround(n);
      } else {
        if (n.kind === 'vertex' && prev && random() < 0.4) edgeNum(prev, n);
      }
    }

    // A ground symbol dropped off the net below a two-terminal part.
    function dropGround(n) {
      const x = snap(n.x);
      const gy = snap(n.y + n.ry + u * 3.2 * bs);
      if (gy > height - u * 2) return;
      const box = [x - u * 0.85 * bs, n.y + n.ry, x + u * 0.85 * bs, gy + u * 1.3 * bs];
      if (!isFree(box)) return;
      claim(box);
      ink([[x, n.y + n.ry + u * 0.25 * bs], [x, gy + u * 0.15 * bs]], wt('reg'));
      for (const [hw, oy] of [[u * 0.7 * bs, 0], [u * 0.5 * bs, u * 0.45 * bs], [u * 0.3 * bs, u * 0.9 * bs]]) {
        ink([[x - hw, gy + oy], [x + hw, gy + oy]], wt('reg'));
      }
    }

    // A +V supply stub above the first part of a circuit stroke.
    function railTop(n) {
      const top = n.y - n.ry - u * 2.0 * bs;
      if (top < u * 2) return;
      const box = [n.x - u * 0.9 * bs, top - fs(0.5), n.x + u * 0.9 * bs, n.y - n.ry];
      if (!isFree(box)) return;
      claim(box);
      ink([[n.x, n.y - n.ry - u * 0.1 * bs], [n.x, top + fs(0.5) * 0.45]], wt('thin'));
      txtRaw(random() < 0.5 ? '+V' : '+9V', n.x, top, fs(0.5), 'center', 'bottom');
    }

    // A small weight number near the middle of a graph edge.
    function edgeNum(a, b) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      txt(smallNum(), mx + u * random(0.3, 1.1) * bs, my - u * random(0.4, 1.3) * bs, fs(0.48), 'center', 'center');
    }

    // ---------------------------------------------------------------- auto fill

    function autoFill() {
      // with mirror on, only draft the left half; the mirror fills in the right
      const w = mirror ? width / 2 : width;
      const runs = [];
      const rows = max(1, floor(height / (u * 18)));
      for (let r = 0; r < rows; r++) {
        const y = u * 9 + r * u * 18 + random(-u * 2, u * 2);
        runs.push([[random(u * 3, u * 10), y], [w - random(u * 3, u * 14), y + random(-u * 3, u * 3)]]);
      }
      for (let c = 0; c < 1; c++) {
        const x = random(w * 0.2, w * 0.8);
        runs.push([[x, random(u * 4, u * 10)], [x + random(-u * 4, u * 4), height - random(u * 4, u * 10)]]);
      }
      for (let d = 0; d < 1; d++) {
        runs.push([[random(w * 0.1, w * 0.4), random(height * 0.1, height * 0.9)], [random(w * 0.6, w * 0.9), random(height * 0.1, height * 0.9)]]);
      }
      let t = 0;
      for (const [a, b] of runs) {
        beginStroke(a[0], a[1]);
        const steps = floor(dist(a[0], a[1], b[0], b[1]) / 5);
        const seed = random(1000);
        for (let i = 1; i <= steps; i++) {
          const q = i / steps;
          autoDelay = t + q * 1400;
          const wob = (noise(seed + q * 4) - 0.5) * u * 6;
          strokeTo(lerp(a[0], b[0], q) + wob, lerp(a[1], b[1], q) + wob);
        }
        autoDelay = t + 1500;
        endStroke();
        t += 500;
      }
      autoDelay = 0;
    }

    // ---------------------------------------------------------------- UI

    function clearAll() {
      paint.clear();
      active = [];
      boxes = [];
    }

    function keyPressedBrush() {
      if (key === '1') styleLock = 'cs';
      else if (key === '2') styleLock = 'circuit';
      else if (key === '0') styleLock = null;
      else if (key === '[') bs = max(0.4, bs / 1.2);
      else if (key === ']') bs = min(4, bs * 1.2);
      else if (key === '-') density = max(0.25, density / 1.4);
      else if (key === '=' || key === '+') density = min(6, density * 1.4);
      else if (key === ' ') { autoFill(); updateHUD(); return false; }
      else if (key === 'm' || key === 'M') mirror = !mirror;
      else if (key === 'e' || key === 'E') eraser = !eraser;
      else if (key === 'c' || key === 'C') clearAll();
      else if (key === 'r' || key === 'R') { clearAll(); u = floor(random(9, 16)); }
      else if (key === 's' || key === 'S') saveCanvas('cs-brush', 'png');
      else if (key === 'h' || key === 'H') toggleHUD();
      updateHUD();
    }

    function updateHUD() {
      setStatus(
        `style: ${styleLock || 'random'}  size: ${bs.toFixed(2)}  density: ${density.toFixed(2)}` +
        `  mirror: ${mirror ? 'on' : 'off'}` + (eraser ? '  [ERASER]' : ''));
    }


    /* ================================================================
       Hero behaviour.
       The brush's own chrome (HUD, keyboard shortcuts, click-drawing) is
       neutralised below. Three pens share the figure generator:
         - an automatic pen slowly sweeps the hero left->right, row by row,
           so the section is always being filled on its own;
         - hovering draws with the same brush along the cursor;
         - occasional branch chains self-draw off the flow: a short coherent
           passage (a few wired circuit parts, or a cs flow of code / math /
           flowchart figures) branching out from a recent figure.
       Every figure lives LIFE_MS, and once more than MAX are on the page
       the oldest (first drawn) are retired first — a FIFO queue.
       ================================================================ */
    const LIFE_MS = 3000;   // a figure stays this long before fading out
    const MAX = 22;         // max live figures on the hero at once
    const FADE_MS = 240;    // fade-out length per retired figure
    const AUTO_STEP = 5;    // px the auto pen moves per frame
    const AUTO_SPACING = 6; // grid modules between auto figures
    const AUTO_ROW = 13;    // grid modules between auto rows
    const BRANCH_FIGS = [3, 5];      // figures per branch chain (min, max)
    const BRANCH_SPACING = 5;        // grid modules between branch figures
    const BRANCH_STEP = 2.4;         // px a branch pen grows per frame
    const BRANCH_GAP = [2800, 5200]; // ms between branch chains (random range)

    let queue = [];         // live figure images, oldest first
    let dying = [];         // figures currently fading out
    let inside = false;     // pointer currently over the hero
    let mx = -1e4, my = -1e4;
    let cvEl = null;        // the hero canvas element
    let curRefs = {};       // reference designators for the pen being stamped
    let autoPen = null;     // the self-sweeping pen {nodes, refs, x, y, dist}
    let lastAutoNode = null; // node of the most recent auto-placed figure (branch roots)
    let branches = [];      // branch chains currently drawing themselves
    let branchNextAt = 0;   // ms when the next branch chain starts

    function setup() {
      const hero = heroHost();
      if (!hero) return;
      const r = hero.getBoundingClientRect();
      const w = max(320, floor(r.width));
      const h = max(320, floor(r.height));
      pixelDensity(min(2, window.devicePixelRatio || 1));
      const cv = createCanvas(w, h);
      cv.parent(hero);
      cvEl = cv.elt;
      u = 12;
      bs = 1;
      density = 2.5;   // denser hover trail than the brush default
      textFont(FONT);
      branchNextAt = millis() + random(1400, 2600); // first chain appears quickly
      window.addEventListener('pointermove', track, { passive: true });
      window.addEventListener('touchmove', track, { passive: true });
      hero.addEventListener('pointerleave', onHostLeave);
    }

    function windowResized() {
      const hero = heroHost();
      if (!hero) return;
      const r = hero.getBoundingClientRect();
      if (r.width < 80 || r.height < 80) return;
      queue = [];
      dying = [];
      autoPen = null;
      lastAutoNode = null;
      branches = [];
      branchNextAt = millis() + random(1400, 2600);
      st = null;
      if (cvEl) resizeCanvas(floor(r.width), floor(r.height));
    }

    // Remember where the pointer is, in canvas coordinates.
    function track(e) {
      if (!cvEl) return;
      const t = (e.touches && e.touches[0]) || e;
      if (t.clientX === undefined) return;
      const r = cvEl.getBoundingClientRect();
      mx = t.clientX - r.left;
      my = t.clientY - r.top;
      inside = mx >= 0 && my >= 0 && mx <= r.width && my <= r.height;
    }

    // The automatic pen: place a figure each time it has travelled enough,
    // sweeping left -> right, then down a row (reading order).
    function advanceAuto() {
      if (!autoPen) {
        autoPen = { nodes: [], refs: {}, x: u * 4, y: u * 5, dist: 0 };
      }
      const p = autoPen;
      p.x += AUTO_STEP;
      p.dist += AUTO_STEP;
      if (p.x > width - u * 4) {
        // next row; wrap back to the top like a continuous fountain
        p.x = u * 4;
        p.y += u * AUTO_ROW;
        if (p.y > height - u * 7) p.y = u * 5;
        p.nodes = [];
        p.refs = {};
        p.dist = 0;
      }
      if (p.dist >= u * AUTO_SPACING) {
        p.dist = 0;
        placeAt(snap(p.x), snap(p.y + random(-u * 1.5, u * 1.5)), p);
        lastAutoNode = p.nodes[p.nodes.length - 1] || null;
      }
    }

    // A branch chain: a short self-drawing passage (a few wired circuit parts,
    // or a cs flow of flowchart / code / math figures) growing off the last
    // auto-placed figure, mostly downward so it reads as a branch off the row.
    // Spawns are spaced out (BRANCH_GAP) and only a couple grow at a time, so
    // the hero gets these modules regularly without turning busy.
    function spawnBranch() {
      if (!lastAutoNode) return;
      if (branches.length >= 2) return;
      if (queue.length > MAX - 3) return; // only brake when the hero is genuinely full
      branches.push({
        nodes: [lastAutoNode], // wire the first figure onto the row behind it
        refs: {},
        x: lastAutoNode.x,
        y: lastAutoNode.y,
        dist: 0,
        angle: PI / 2 + random(-1.15, 1.15), // downward fan
        elec: random() < 0.5, // one coherent world per chain: circuit or cs
        steps: floor(random(BRANCH_FIGS[0], BRANCH_FIGS[1] + 1)),
      });
    }

    function advanceBranches() {
      for (let i = branches.length - 1; i >= 0; i--) {
        const b = branches[i];
        b.x += cos(b.angle) * BRANCH_STEP;
        b.y += sin(b.angle) * BRANCH_STEP;
        b.dist += BRANCH_STEP;
        if (b.dist < u * BRANCH_SPACING) continue;
        b.dist = 0;
        // meander slightly to the side so the chain looks hand-worked
        const x = snap(b.x + -sin(b.angle) * random(-u * 1.2, u * 1.2));
        const y = snap(b.y + cos(b.angle) * random(-u * 1.2, u * 1.2));
        if (x < u * 2 || x > width - u * 2 || y < u * 2 || y > height - u * 2) {
          branches.splice(i, 1);
          continue;
        }
        placeAt(x, y, b, b.elec);
        b.angle += random(-0.14, 0.14);
        if (--b.steps <= 0) branches.splice(i, 1);
      }
    }

    function draw() {
      const now = millis();

      advanceAuto();

      // occasional branch chains growing off the auto flow
      if (now >= branchNextAt) {
        spawnBranch();
        branchNextAt = now + random(BRANCH_GAP[0], BRANCH_GAP[1]);
      }
      try {
        advanceBranches();
      } catch (err) {
        // never let a bad chain kill the hero's draw loop; note it and move on
        if (window.__heroErr === undefined) window.__heroErr = [];
        window.__heroErr.push(String(err && err.message));
        branches.length = 0;
      }

      // hover drives the stroke: enter the hero -> start a stroke and stamp a
      // figure at the cursor; move -> the follower places figures as you go
      if (inside) {
        if (!st) { beginStroke(mx, my); placeNode(snap(mx), snap(my)); }
        else { st.tx = mx; st.ty = my; }
      } else if (st) {
        st = null;
      }
      advanceStroke();

      // retire anything past its shelf life, oldest first (FIFO)
      prune(now);

      // compose the hero: white paper, live figures, then fading-out ones
      background(255);
      for (const c of queue) image(c.img, c.x0, c.y0);
      for (let i = dying.length - 1; i >= 0; i--) {
        const d = dying[i];
        const a = 1 - (now - d.t) / FADE_MS;
        if (a <= 0) { dying.splice(i, 1); continue; }
        push();
        tint(255, 255 * a);
        image(d.img, d.x0, d.y0);
        pop();
      }
    }

    function prune(now) {
      let released = 0;
      while (queue.length && released < 2 && now - queue[0].t > LIFE_MS) {
        retire(queue.shift(), now);
        released++;
      }
      while (queue.length > MAX && released < 2) {
        retire(queue.shift(), now);
        released++;
      }
    }
    function retire(c, now) { dying.push({ img: c.img, x0: c.x0, y0: c.y0, t: now }); }

    // override: a minimal stroke state (keys / locks / eraser are gone)
    function beginStroke(x, y) {
      st = { x, y, tx: x, ty: y, pressed: true, travel: 0, nodes: [], refs: {} };
    }

    // place a random figure with a given pen (list of previous nodes + refs),
    // snapshot it into its own bitmap, and push it onto the queue
    function placeAt(x, y, pen, elecForce) {
      const prev = pen.nodes[pen.nodes.length - 1] || null;
      if (prev && dist(prev.x, prev.y, x, y) < u * 2.5 * bs) return;
      const elec = elecForce === undefined ? random() < 0.5 : elecForce;
      const kind = elec ? weightedPick(EL_PARTS) : weightedPick(nextSection().pool);
      const n = makeNode(kind, x, y, elec);
      if (prev) n.o = abs(prev.x - x) >= abs(prev.y - y) ? 'h' : 'v';
      if (n.swap && n.o === 'v') { const t = n.rx; n.rx = n.ry; n.ry = t; }
      curRefs = pen.refs;
      if (elec) n.ref = refFor(n);
      rec = [];
      if (prev) connect(prev, n, elec);
      drawNode(n);
      if (random() < 0.9) label(n, elec);
      decorate(n, prev, elec);
      pen.nodes.push(n);
      makeComponent(rec);
    }

    // hover pen uses the global stroke state through the old entry point
    function placeNode(x, y) { placeAt(x, y, st); }

    // reference designators come from whichever pen is stamping
    function refFor(n) {
      const m = { resistor: 'R', capacitor: 'C', inductor: 'L', diode: 'D', led: 'D', cell: 'V', gate: 'U', chip: 'U', opamp: 'U' }[n.kind];
      if (!m) return null;
      const k = (curRefs[m] = (curRefs[m] || 0) + 1);
      return m + k;
    }

    // collision claims are unnecessary in the ephemeral hero
    function claim() { }

    // Render a finished component into its own little offscreen bitmap.
    function makeComponent(prims) {
      rec = null;
      if (!prims.length) return;
      if (random() < INK.speck) {
        const src = prims.find(p => p.k === 'ink');
        if (src) prims.push(specksNear(src.runs[0].pts[0]));
      }
      const b = primsBounds(prims);
      const bw = max(2, ceil(b[2] - b[0]));
      const bh = max(2, ceil(b[3] - b[1]));
      const img = createGraphics(bw, bh);
      img.strokeCap(ROUND);
      img.strokeJoin(ROUND);
      img.textFont(FONT);
      img.push();
      img.translate(-b[0], -b[1]);
      drawPrimsFinal(img, prims);
      img.pop();
      queue.push({ img, x0: b[0], y0: b[1], t: millis() });
    }

    // A generous bounding box around every primitive of a component.
    function primsBounds(prims) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const hit = (x, y) => {
        if (x < x0) x0 = x; if (y < y0) y0 = y;
        if (x > x1) x1 = x; if (y > y1) y1 = y;
      };
      for (const p of prims) {
        if (p.k === 'ink') {
          if (p.poly) for (const v of p.poly) hit(v[0], v[1]);
          for (const r of p.runs) for (const v of r.pts) hit(v[0], v[1]);
        } else if (p.k === 'text') {
          const half = (p.tw !== undefined ? p.tw : p.s.length * p.size * 0.6) / 2;
          hit(p.x - half - p.size * 0.6, p.y - p.size * 1.2);
          hit(p.x + half + p.size * 0.6, p.y + p.size * 1.2);
        } else if (p.k === 'speck') {
          for (const d of p.dots) hit(d[0] - d[2], d[1] - d[2]);
        } else {
          for (const v of p.pts) hit(v[0], v[1]);
        }
      }
      if (x0 > x1) { x0 = 0; y0 = 0; x1 = 12; y1 = 12; }
      const pad = 6;
      return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
    }

    // Draw every primitive of a component at full strength (q = 1).
    function drawPrimsFinal(g, prims) {
      for (const p of prims) {
        if (p.k === 'ink') {
          if (p.fill && p.poly) {
            g.noStroke();
            g.fill(p.fill);
            polyShape(g, p.poly, true);
          }
          for (const r of p.runs) sliceRun(g, r, 0, r.len, p.w);
        } else if (p.k === 'text') drawText(g, p, 1);
        else if (p.k === 'speck') drawSpecks(g, p, 1);
        else drawBlot(g, p, 1);
      }
    }

    // neutralise the brush's old chrome: no click-drawing, no keys
    function mousePressed() { return false; }
    function mouseDragged() { }
    function mouseReleased() { }
    function keyPressed() { return false; }

/* ======================================================================
   React mount API — added when this sketch was ported into the ECSSA site.

   Everything above is the original brush engine and hero behaviour, unchanged.
   p5 runs in global mode (`new p5()` with no sketch argument), which is what
   makes the bare createCanvas / random / millis / width / height calls above
   resolve, exactly as they did on the standalone page.

   Only the lifecycle hooks the hero actually uses are exposed to p5:
   `setup`, `draw` and `windowResized`. The original's neutralised
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
 * Start the sketch inside `host` and return its teardown function.
 * `p5Ctor` is the p5 constructor (imported lazily so p5 stays out of the
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
