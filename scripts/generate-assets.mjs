/**
 * Generates the binary placeholder assets that can't live in a text file:
 *   public/favicon.ico          — 32x32 circuit-node mark on navy
 *   public/landingpage/og-image.png — branded 1200x630 social card
 *
 * Everything is drawn on a supersampled canvas and box-filtered down for clean
 * edges, then encoded with a tiny hand-rolled PNG writer (zlib only, no deps).
 *
 *   npm run assets
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const NAVY = [4, 27, 59, 255];
const WHITE = [255, 255, 255, 255];
// a 4% navy wash over white — the page's tinted surface
const TINT = [245, 246, 248, 255];
const BLUE = [3, 116, 223, 255];
const BLUE_DIM = [3, 116, 223, 110];

/* ------------------------------- drawing ---------------------------------- */

function createCanvas(width, height, background = [0, 0, 0, 0]) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = background[0];
    data[i * 4 + 1] = background[1];
    data[i * 4 + 2] = background[2];
    data[i * 4 + 3] = background[3];
  }
  return { width, height, data };
}

function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const i = (y * canvas.width + x) * 4;
  const alpha = color[3] / 255;
  for (let c = 0; c < 3; c += 1) {
    canvas.data[i + c] = Math.round(color[c] * alpha + canvas.data[i + c] * (1 - alpha));
  }
  canvas.data[i + 3] = Math.max(canvas.data[i + 3], color[3]);
}

function fillRect(canvas, x, y, width, height, color) {
  for (let yy = Math.round(y); yy < Math.round(y + height); yy += 1) {
    for (let xx = Math.round(x); xx < Math.round(x + width); xx += 1) {
      setPixel(canvas, xx, yy, color);
    }
  }
}

function fillCircle(canvas, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let yy = cy - radius; yy <= cy + radius; yy += 1) {
    for (let xx = cx - radius; xx <= cx + radius; xx += 1) {
      const dx = xx - cx;
      const dy = yy - cy;
      if (dx * dx + dy * dy <= r2) setPixel(canvas, xx, yy, color);
    }
  }
}

function fillRoundedRect(canvas, x, y, width, height, radius, color) {
  fillRect(canvas, x + radius, y, width - radius * 2, height, color);
  fillRect(canvas, x, y + radius, width, height - radius * 2, color);
  const corners = [
    [x + radius, y + radius],
    [x + width - radius - 1, y + radius],
    [x + radius, y + height - radius - 1],
    [x + width - radius - 1, y + height - radius - 1],
  ];
  for (const [cx, cy] of corners) fillCircle(canvas, cx, cy, radius, color);
}

function drawLine(canvas, x0, y0, x1, y1, thickness, color) {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  const half = Math.floor(thickness / 2);

  for (;;) {
    fillRect(canvas, x - half, y - half, thickness, thickness, color);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function drawPolyline(canvas, points, thickness, color) {
  for (let i = 0; i < points.length - 1; i += 1) {
    drawLine(canvas, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], thickness, color);
  }
}

/** Minimal 5x7 bitmap font — only the glyphs the social card needs. */
const GLYPHS = {
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
};

function measureText(text, scale, spacing) {
  return text.length * 5 * scale + Math.max(0, text.length - 1) * spacing * scale;
}

function drawText(canvas, text, x, y, scale, color, spacing = 1) {
  let cursor = x;
  for (const char of text.toUpperCase()) {
    const glyph = GLYPHS[char];
    if (glyph) {
      for (let row = 0; row < 7; row += 1) {
        for (let col = 0; col < 5; col += 1) {
          if (glyph[row][col] === "1") {
            fillRect(canvas, cursor + col * scale, y + row * scale, scale, scale, color);
          }
        }
      }
    }
    cursor += (5 + spacing) * scale;
  }
  return cursor;
}

function downsample(canvas, factor) {
  const width = canvas.width / factor;
  const height = canvas.height / factor;
  const out = createCanvas(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < factor; sy += 1) {
        for (let sx = 0; sx < factor; sx += 1) {
          const i = ((y * factor + sy) * canvas.width + (x * factor + sx)) * 4;
          r += canvas.data[i];
          g += canvas.data[i + 1];
          b += canvas.data[i + 2];
          a += canvas.data[i + 3];
        }
      }
      const count = factor * factor;
      const o = (y * width + x) * 4;
      out.data[o] = Math.round(r / count);
      out.data[o + 1] = Math.round(g / count);
      out.data[o + 2] = Math.round(b / count);
      out.data[o + 3] = Math.round(a / count);
    }
  }
  return out;
}

/* ----------------------------- png encoding -------------------------------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(canvas) {
  const { width, height, data } = canvas;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Wrap a PNG in a single-image .ico container (PNG-in-ICO, Vista+). */
function encodeIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry[2] = 0; // palette
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(6 + 16, 12); // data offset

  return Buffer.concat([header, entry, png]);
}

/* ------------------------------- artwork ----------------------------------- */

function buildFavicon() {
  const scale = 3;
  const size = 32 * scale;
  const canvas = createCanvas(size, size, [0, 0, 0, 0]);

  fillRoundedRect(canvas, 0, 0, size, size, 7 * scale, NAVY);

  const stroke = 3 * scale;
  const center = size / 2;
  drawLine(canvas, 9 * scale, center, 23 * scale, center, stroke, BLUE);
  drawLine(canvas, center, 9 * scale, center, 23 * scale, stroke, BLUE);
  fillCircle(canvas, center, center, 3 * scale, NAVY);
  fillCircle(canvas, center, center, 2 * scale, BLUE);

  return downsample(canvas, scale);
}

function buildOgImage() {
  const scale = 2;
  const width = 1200 * scale;
  const height = 630 * scale;
  const canvas = createCanvas(width, height, WHITE);

  // Circuit traces on the right-hand side, washed out behind the wordmark.
  fillRect(canvas, width / 2, 0, width / 2, height, TINT);
  const trace = 2 * scale;
  const dim = BLUE_DIM;
  drawPolyline(canvas, [[width * 0.62, 40 * scale], [width * 0.8, 40 * scale], [width * 0.88, 130 * scale], [width - 40 * scale, 130 * scale]], trace, dim);
  drawPolyline(canvas, [[width * 0.55, height - 40 * scale], [width * 0.72, height - 40 * scale], [width * 0.8, height - 130 * scale], [width - 40 * scale, height - 130 * scale]], trace, dim);
  drawPolyline(canvas, [[width * 0.93, 160 * scale], [width * 0.93, height - 160 * scale]], trace, dim);
  fillCircle(canvas, Math.round(width * 0.62), 40 * scale, 4 * scale, BLUE);
  fillCircle(canvas, Math.round(width * 0.55), height - 40 * scale, 4 * scale, BLUE);
  fillCircle(canvas, Math.round(width - 40 * scale), 130 * scale, 4 * scale, BLUE);
  fillCircle(canvas, Math.round(width - 40 * scale), height - 130 * scale, 4 * scale, BLUE);

  // Node mark above the wordmark.
  const markY = 175 * scale;
  const markCenterX = width / 4;
  drawLine(canvas, markCenterX - 90 * scale, markY, markCenterX + 90 * scale, markY, 3 * scale, BLUE);
  drawLine(canvas, markCenterX, markY - 45 * scale, markCenterX, markY + 45 * scale, 3 * scale, BLUE);
  fillCircle(canvas, markCenterX, markY, 11 * scale, BLUE);
  fillCircle(canvas, markCenterX, markY, 5 * scale, NAVY);

  // Wordmark + accent rule.
  const textScale = 42 * scale;
  const textWidth = measureText("ECSSA", textScale, 1);
  const textX = Math.round((width / 2 - textWidth) / 2);
  drawText(canvas, "ECSSA", textX, Math.round(markY + 70 * scale), textScale, NAVY);
  fillRect(canvas, textX, Math.round(markY + 78 * scale + 7 * textScale + 40 * scale), textWidth, 5 * scale, BLUE);

  return downsample(canvas, scale);
}

/* --------------------------------- write ----------------------------------- */

mkdirSync(join(root, "public", "landingpage"), { recursive: true });
for (const folder of ["events", "committee", "gallery"]) {
  mkdirSync(join(root, "public", folder), { recursive: true });
  writeFileSync(join(root, "public", folder, ".gitkeep"), "");
}

writeFileSync(join(root, "public", "favicon.ico"), encodeIco(encodePng(buildFavicon()), 32));
writeFileSync(join(root, "public", "landingpage", "og-image.png"), encodePng(buildOgImage()));

console.log("Generated public/favicon.ico and public/landingpage/og-image.png");
