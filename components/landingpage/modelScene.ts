/**
 * WebGL stage behind the Electronics sub-section's model viewer.
 *
 * Owns the ogl renderer/scene, loads GLB models on demand (cached), applies
 * the site's four-color palette shader over the loader's normal material,
 * frames each model with its world-space bounds, spins it slowly, supports
 * horizontal drag, and skips drawing while off-screen. The React wrapper
 * (ModelViewer.tsx) only talks to the handle returned by mountModelStage.
 */
import type { Camera, Mesh, Program, Renderer, Transform } from "ogl";

type Gl = Renderer["gl"];

interface PaletteVec3 {
  value: [number, number, number];
}

const PALETTE = {
  white: [1, 1, 1] as [number, number, number],
  navy: [0.016, 0.106, 0.231] as [number, number, number], // #041b3b
  blue: [0.012, 0.455, 0.875] as [number, number, number], // #0374df
};

const VERTEX = /* glsl */ `
  precision highp float;
  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat3 normalMatrix;
  uniform mat4 projectionMatrix;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    vUv = uv;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  uniform vec3 uBaseColor;
  uniform sampler2D uTexture;
  uniform float uUseTexture;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 albedo = uBaseColor;
    if (uUseTexture > 0.5) {
      vec4 tex = texture2D(uTexture, vUv);
      albedo *= tex.rgb;
    }
    // Gentle, near-white lighting so the model's own colors stay true.
    float lambert = dot(n, normalize(vec3(0.4, 0.85, 0.75)));
    float shade = mix(0.62, 1.0, smoothstep(-0.4, 0.9, lambert));
    float fill = mix(0.72, 1.0, smoothstep(-0.3, 0.9, dot(n, normalize(vec3(-0.5, -0.2, 0.6)))));
    gl_FragColor = vec4(albedo * shade * fill, 1.0);
  }
`;

interface GLTFMaterialLike {
  baseColorFactor?: [number, number, number, number];
  baseColorTexture?: { texture: unknown } | null;
}

interface Bounds {
  min: [number, number, number];
  max: [number, number, number];
}

interface StageModel {
  root: Transform;
  baseScale: number;
}

export interface ModelStageHandle {
  show(url: string): Promise<void>;
  destroy(): void;
}

interface DragState {
  down: boolean;
  lastX: number;
  lastY: number;
  velocity: number;
}

interface MountOptions {
  dragRef: { current: DragState };
  visibleRef: { current: boolean };
}

export function mountModelStage(host: HTMLElement, { dragRef, visibleRef }: MountOptions): () => ModelStageHandle {
  let disposed = false;
  let ready = false;
  let raf = 0;

  let renderer: Renderer;
  let gl: Gl;
  let scene: Transform;
  let camera: Camera;
  let ProgramCtor: typeof Program;

  const cache = new Map<string, StageModel>();
  let active: StageModel | null = null;

  const spin = { angle: 0, pitch: 0, velocity: 0, scale: 0.001, targetScale: 1 };

  // 1x1 white fallback so every program gets a valid sampler uniform.
  // Assigned during init() before any program is patched.
  let whiteFallback!: { value: unknown };

  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h);
    camera.perspective({ aspect: w / h });
  }

  function patchPrograms(root: Transform) {
    root.traverse((node) => {
      const mesh = node as unknown as Mesh;
      if (!mesh.program) return;
      const material = (mesh.program as { gltfMaterial?: GLTFMaterialLike }).gltfMaterial;

      // Original color: baseColorFactor always applies; baseColorTexture
      // multiplies on top when the primitive has one (and uv attributes).
      const factor = material?.baseColorFactor ?? [1, 1, 1];
      const texture = material?.baseColorTexture?.texture ?? null;
      const uniforms: Record<string, { value: unknown }> = {
        uBaseColor: { value: [factor[0], factor[1], factor[2]] },
        uTexture: texture ? { value: texture } : whiteFallback,
        uUseTexture: { value: texture ? 1 : 0 },
      };

      mesh.program = new ProgramCtor(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        uniforms,
        cullFace: null, // some GLB parts face inward; draw both sides
      });
    });
  }

  /** World-space bounds of every mesh under `root` (root must be scene-less). */
  function worldBounds(root: Transform): Bounds {
    root.updateMatrixWorld(true);
    const min: [number, number, number] = [Infinity, Infinity, Infinity];
    const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    const v = [0, 0, 0];

    root.traverse((node) => {
      const mesh = node as unknown as Mesh;
      const pos = mesh.geometry?.attributes?.position;
      if (!pos?.data) return;
      const data = pos.data as ArrayLike<number>;
      for (let i = 0; i < data.length; i += 3) {
        for (let a = 0; a < 3; a++) v[a] = data[i + a];
        // local vertex -> world: row-major Mat4, world = M * [v, 1]
        const m = mesh.worldMatrix;
        for (let a = 0; a < 3; a++) {
          const world = m[a] * v[0] + m[4 + a] * v[1] + m[8 + a] * v[2] + m[12 + a];
          if (world < min[a]) min[a] = world;
          if (world > max[a]) max[a] = world;
        }
      }
    });

    if (min[0] === Infinity) return { min: [-1, -1, -1], max: [1, 1, 1] };
    return { min, max };
  }

  function frameModel(entry: StageModel) {
    const { min, max } = worldBounds(entry.root);
    const size = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
    const scale = 2.6 / size;
    entry.baseScale = scale;
    entry.root.scale.set(scale, scale, scale);

    // Re-center on origin at the *scaled* size.
    const cx = ((min[0] + max[0]) / 2) * scale;
    const cy = ((min[1] + max[1]) / 2) * scale;
    const cz = ((min[2] + max[2]) / 2) * scale;
    entry.root.position.set(-cx, -cy, -cz);
  }

  async function loadModel(url: string): Promise<StageModel> {
    const hit = cache.get(url);
    if (hit) return hit;

    const { GLTFLoader } = await import("ogl");
    const gltf = await GLTFLoader.load(gl, url);
    const root = gltf.scene[0];
    patchPrograms(root);

    const entry: StageModel = { root, baseScale: 1 };
    frameModel(entry); // bounds need world matrices; root has no parent yet
    cache.set(url, entry);
    return entry;
  }

  function loop() {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    if (!ready || !visibleRef.current) return;

    spin.angle += 0.006 + dragRef.current.velocity;
    dragRef.current.velocity *= 0.94;

    if (active) {
      spin.scale += (spin.targetScale - spin.scale) * 0.1;
      active.root.scale.set(active.baseScale * spin.scale, active.baseScale * spin.scale, active.baseScale * spin.scale);
      active.root.rotation.y = spin.angle;
      active.root.rotation.x = spin.pitch;
    }

    renderer.render({ scene, camera });
  }

  function onDown(e: PointerEvent) {
    dragRef.current.down = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  }
  function onMove(e: PointerEvent) {
    if (!dragRef.current.down) return;
    dragRef.current.velocity = (e.clientX - dragRef.current.lastX) * 0.004;
    spin.pitch += (e.clientY - dragRef.current.lastY) * 0.004;
    spin.pitch = Math.max(-1.1, Math.min(1.1, spin.pitch));
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  }
  function onUp() {
    dragRef.current.down = false;
  }

  async function init(): Promise<ModelStageHandle> {
    const ogl = await import("ogl");
    ProgramCtor = ogl.Program;

    renderer = new ogl.Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      preserveDrawingBuffer: true,
    });
    gl = renderer.gl as Gl;
    gl.clearColor(0, 0, 0, 0);

    // 1x1 white fallback texture: every program gets a valid sampler uniform,
    // and untextured primitives simply ignore it (uUseTexture = 0).
    const fallbackCanvas = document.createElement("canvas");
    fallbackCanvas.width = fallbackCanvas.height = 1;
    const fctx = fallbackCanvas.getContext("2d")!;
    fctx.fillStyle = "#fff";
    fctx.fillRect(0, 0, 1, 1);
    whiteFallback = { value: new ogl.Texture(gl, { image: fallbackCanvas }) };
    gl.canvas.classList.add("model-viewer__gl");
    host.appendChild(gl.canvas);

    scene = new ogl.Transform();
    camera = new ogl.Camera(gl, { fov: 35, near: 0.1, far: 100 });
    // Slight elevation so flat boards never spin perfectly edge-on.
    camera.position.set(0, 1.6, 5);
    camera.lookAt([0, 0, 0]);

    resize();
    window.addEventListener("resize", resize);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visibleRef.current = e.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(host);

    host.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    ready = true;
    loop();

    return {
      async show(url: string) {
        const entry = await loadModel(url);
        if (active) scene.removeChild(active.root);
        active = entry;
        entry.root.setParent(scene);
        spin.scale = 0.001;
        spin.targetScale = 1;
      },
      destroy() {
        disposed = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        host.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        cache.clear();
        gl?.canvas?.parentNode?.removeChild(gl.canvas);
      },
    };
  }

  // Stage boots asynchronously; every call to the returned runner queues an
  // action until the handle exists (and drops them if we were disposed first).
  const pending: ((h: ModelStageHandle) => void)[] = [];
  let handle: ModelStageHandle | null = null;
  let tornDown = false;

  void init().then((h) => {
    if (tornDown) {
      h.destroy();
      return;
    }
    handle = h;
    for (const fn of pending.splice(0)) fn(h);
  });

  const run = (fn: (h: ModelStageHandle) => void) => {
    if (handle) fn(handle);
    else if (!tornDown) pending.push(fn);
  };

  return () => ({
    show: (url: string) =>
      new Promise<void>((resolve, reject) =>
        run((h) => h.show(url).then(resolve, reject))
      ),
    destroy: () => {
      tornDown = true;
      if (handle) handle.destroy();
    },
  });
}
