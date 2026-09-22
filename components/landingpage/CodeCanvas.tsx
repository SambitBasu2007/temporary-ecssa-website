"use client";

import { useEffect, useRef } from "react";

import "./CodeCanvas.css";

interface CodeCanvasProps {
  snippets: { title: string; code: string }[];
}

/**
 * Animated "live coding" canvas for the Computer Science sub-section: types
 * each snippet character-by-character like a terminal, holds, then erases and
 * moves to the next. Pure canvas 2D — colors come from the site palette, and
 * rendering pauses while the canvas is off-screen or reduced motion is set
 * (in which case the first snippet renders statically).
 */
export default function CodeCanvas({ snippets }: CodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let disposed = false;
    let visible = true;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const COLORS = {
      bg: "#ffffff",
      chrome: "rgba(4, 27, 59, 0.14)",
      title: "#041b3b",
      text: "#041b3b",
      muted: "rgba(4, 27, 59, 0.68)",
      accent: "#0374df",
      caret: "#0374df",
    };

    const FONT = (px: number, mono = true) =>
      `${px}px ${mono ? '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace' : '"Geist", sans-serif'}`;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas!);

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) visible = e.isIntersecting;
    });
    io.observe(canvas!);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- typing state -------------------------------------------------------
    // Whole cycle (type + hold) stays under ~3s per snippet: the per-tick
    // advance is derived from each snippet's length.
    const CYCLE_MS = 3000;
    const HOLD_MS = 1100;
    const ERASE_MS = 320;

    let snippetIndex = 0;
    let charCount = reduced ? Infinity : 0;
    let phase: "typing" | "holding" | "erasing" = reduced ? "holding" : "typing";
    let lastTick = 0;
    let holdUntil = 0;
    let caretOn = true;

    const typeStep = (totalChars: number) => Math.max(1, Math.round((totalChars * 26) / (CYCLE_MS - HOLD_MS)));
    const eraseStep = (totalChars: number) => Math.max(2, Math.round((totalChars * 26) / ERASE_MS));

    const LINE_H = 19;
    const PAD = 22;

    function drawFrame(now: number) {
      if (disposed) return;
      raf = requestAnimationFrame(drawFrame);
      if (!visible) return;

      const snippet = snippets[snippetIndex % snippets.length];
      const lines = snippet.code.split("\n");
      const total = lines.join("\n").length;
      const step = typeStep(total);
      const erase = eraseStep(total);
      if (phase === "typing") {
        if (now - lastTick > 26) {
          charCount += step;
          lastTick = now;
          if (charCount >= total) {
            phase = "holding";
            holdUntil = now + HOLD_MS;
          }
        }
      } else if (phase === "holding") {
        if (now > holdUntil) {
          phase = "erasing";
        }
      } else {
        if (now - lastTick > 26) {
          charCount -= erase;
          lastTick = now;
          if (charCount <= 0) {
            charCount = 0;
            snippetIndex = (snippetIndex + 1) % snippets.length;
            phase = "typing";
          }
        }
      }
      if (now % 530 < 17) caretOn = !caretOn;

      // ---- paint ------------------------------------------------------------
      const c = ctx!;
      c.clearRect(0, 0, width, height);

      // chrome bar
      c.fillStyle = COLORS.chrome;
      c.fillRect(0, 0, width, 34);
      c.fillStyle = COLORS.title;
      c.font = FONT(11, false);
      c.textBaseline = "middle";
      c.textAlign = "left";
      c.fillText(snippet.title.toUpperCase(), PAD, 18);

      // three "window" dots in accent/muted
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.arc(width - 18 - i * 14, 17, 3.5, 0, Math.PI * 2);
        c.fillStyle = i === 0 ? COLORS.accent : COLORS.chrome;
        c.fill();
      }

      // visible text
      let budget = phase === "typing" ? charCount : phase === "erasing" ? Math.max(0, charCount) : Infinity;
      if (phase === "holding") budget = Infinity;
      let y = 34 + PAD;
      let cursorX = PAD;
      let cursorY = y;

      for (const line of lines) {
        if (budget <= 0) break;
        const shown = line.slice(0, budget);
        budget -= line.length + 1; // +1 newline

        c.font = FONT(12.5);
        c.textAlign = "left";
        c.fillStyle = COLORS.text;
        c.fillText(shown, PAD, y);
        cursorX = PAD + c.measureText(shown).width;
        cursorY = y;
        y += LINE_H;
      }

      // caret
      if (caretOn && phase !== "holding") {
        c.fillStyle = COLORS.caret;
        c.fillRect(cursorX + 1, cursorY - 8, 7, 14);
      }

      // progress dots
      const n = snippets.length;
      for (let i = 0; i < n; i++) {
        c.beginPath();
        c.arc(width / 2 - ((n - 1) * 10) / 2 + i * 10, height - 14, 3, 0, Math.PI * 2);
        c.fillStyle = i === snippetIndex % n ? COLORS.accent : COLORS.chrome;
        c.fill();
      }
    }

    raf = requestAnimationFrame(drawFrame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [snippets]);

  return <canvas ref={canvasRef} className="code-canvas" aria-label="Animated C code examples" role="img" />;
}
