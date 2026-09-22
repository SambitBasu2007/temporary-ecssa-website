"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";

import "./ModelViewer.css";

export interface Model3D {
  url: string;
  name: string;
}

interface ModelViewerProps {
  models: Model3D[];
}

type Status = "loading" | "ready" | "error";

/**
 * 3D model viewer for the Electronics sub-section.
 *
 * The WebGL stage (modelScene.ts, ogl lazily imported) is mounted once; each
 * model GLB streams in on demand and is cached. While a model loads, the
 * lottie logo (public/assets/logo.lottie) plays as the loading overlay and
 * fades out when the model is ready. Drag horizontally to spin the model.
 */
export default function ModelViewer({ models }: ModelViewerProps) {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const lottieHostRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("loading");

  const dragRef = useRef({ down: false, lastX: 0, lastY: 0, velocity: 0 });
  const visibleRef = useRef(false);
  const destroyRef = useRef<(() => void) | null>(null);
  const showRef = useRef<((url: string) => Promise<void>) | null>(null);
  const loadedRef = useRef(new Set<string>());

  // Mount the stage once.
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;
    let disposed = false;

    void (async () => {
      const { mountModelStage } = await import("./modelScene");
      if (disposed) return;
      const stage = mountModelStage(host, { dragRef, visibleRef })();
      destroyRef.current = stage.destroy;
      showRef.current = stage.show;
    })();

    return () => {
      disposed = true;
      destroyRef.current?.();
      destroyRef.current = null;
      showRef.current = null;
    };
  }, []);

  // Lottie loader: lazy dotlottie import, driven by status.
  useEffect(() => {
    const host = lottieHostRef.current;
    if (!host) return;

    let dotLottie: { destroy: () => void } | null = null;
    let cancelled = false;

    if (status === "loading") {
      void import("@lottiefiles/dotlottie-web").then(({ DotLottie }) => {
        if (cancelled || !host) return;
        dotLottie = new DotLottie({
          canvas: document.createElement("canvas"),
          src: "/assets/logo.lottie",
          autoplay: true,
          loop: true,
        });
        const canvas = dotLottie ? (dotLottie as unknown as { canvas: HTMLCanvasElement }).canvas : null;
        if (canvas) host.replaceChildren(canvas);
      });
    } else {
      host.replaceChildren();
    }

    return () => {
      cancelled = true;
      dotLottie?.destroy();
    };
  }, [status]);

  const load = useCallback(
    (i: number) => {
      const url = models[i]?.url;
      if (!url || !showRef.current) return;
      // Cached models swap instantly — skip the loading overlay so auto-cycle
      // doesn't flash it every 5 seconds.
      if (!loadedRef.current.has(url)) setStatus("loading");
      showRef.current(url)
        .then(() => {
          loadedRef.current.add(url);
          setStatus("ready");
        })
        .catch(() => setStatus("error"));
    },
    [models]
  );

  // First model once the stage exists.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (showRef.current) {
        window.clearInterval(t);
        load(0);
      }
    }, 50);
    return () => window.clearInterval(t);
  }, [load]);

  const cycle = useCallback(
    (dir: 1 | -1) => {
      setIndex((prev) => {
        const next = (prev + dir + models.length) % models.length;
        load(next);
        return next;
      });
    },
    [load, models.length]
  );

  // Auto-cycle every 5 seconds. The timer restarts on every model change
  // (manual clicks included), and holds while the viewer is off-screen.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (!visibleRef.current) return;
      setIndex((prev) => {
        const next = (prev + 1) % models.length;
        load(next);
        return next;
      });
    }, 5000);
    return () => window.clearInterval(t);
  }, [index, load, models.length]);

  return (
    <div className="model-viewer">
      <div ref={canvasHostRef} className="model-viewer__canvas" />

      <div className={`model-viewer__loader ${status !== "loading" ? "is-hidden" : ""}`}>
        <div ref={lottieHostRef} className="model-viewer__lottie" aria-hidden="true" />
        <p className="model-viewer__loader-label">Loading model…</p>
      </div>

      <div className="model-viewer__controls">
        <button type="button" className="model-viewer__arrow" onClick={() => cycle(-1)} aria-label="Previous model">
          <ArrowLeft size={18} weight="bold" aria-hidden="true" />
        </button>
        <span className="model-viewer__name" aria-live="polite">
          {models[index]?.name}
        </span>
        <button type="button" className="model-viewer__arrow" onClick={() => cycle(1)} aria-label="Next model">
          <ArrowRight size={18} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
