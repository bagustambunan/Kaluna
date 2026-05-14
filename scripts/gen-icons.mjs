/**
 * Generates PNG icons for PWA and iOS home screen.
 * Uses only Node.js built-ins (no extra packages needed).
 * Run: node scripts/gen-icons.mjs
 */
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir  = join(__dirname, '..', 'public')
const iconsDir   = join(publicDir, 'icons')
mkdirSync(iconsDir, { recursive: true })

// ── PNG encoder ────────────────────────────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = (crc >>> 8) ^ crcTable[(crc ^ b) & 0xFF]
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const tb  = Buffer.from(type, 'ascii')
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length)
  const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(Buffer.concat([tb, data])))
  return Buffer.concat([len, tb, data, crc])
}

function encodePng(size, rgba) {
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = ihdr[11] = ihdr[12] = 0

  const stride = 1 + size * 4
  const raw = Buffer.allocUnsafe(size * stride)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0
    for (let x = 0; x < size; x++) {
      const si = (y * size + x) * 4
      const di = y * stride + 1 + x * 4
      raw[di] = rgba[si]; raw[di+1] = rgba[si+1]
      raw[di+2] = rgba[si+2]; raw[di+3] = rgba[si+3]
    }
  }
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Drawing helpers ────────────────────────────────────────────────────────────
function drawIcon(size, { maskable = false } = {}) {
  const px = new Uint8Array(size * size * 4)

  // Background
  const pad = maskable ? Math.round(size * 0.1) : 0
  const BG = [0x17, 0x17, 0x17]   // neutral-900: #171717
  const RADIUS = maskable ? 0 : Math.round(size * 0.22)

  // Fill entire canvas first (for maskable: use bg everywhere)
  if (maskable) {
    for (let i = 0; i < size * size; i++) {
      px[i*4]=BG[0]; px[i*4+1]=BG[1]; px[i*4+2]=BG[2]; px[i*4+3]=255
    }
  } else {
    // Fill with transparent, then draw rounded rect background
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        // Rounded rect: check if inside
        const inside = isInsideRoundedRect(x, y, 0, 0, size-1, size-1, RADIUS)
        if (inside) { px[i]=BG[0]; px[i+1]=BG[1]; px[i+2]=BG[2]; px[i+3]=255 }
        else { px[i]=0; px[i+1]=0; px[i+2]=0; px[i+3]=0 }
      }
    }
  }

  function isInsideRoundedRect(x, y, x1, y1, x2, y2, r) {
    if (x < x1 || x > x2 || y < y1 || y > y2) return false
    // Corner checks
    if (x < x1+r && y < y1+r) return dist(x,y,x1+r,y1+r) <= r
    if (x > x2-r && y < y1+r) return dist(x,y,x2-r,y1+r) <= r
    if (x < x1+r && y > y2-r) return dist(x,y,x1+r,y2-r) <= r
    if (x > x2-r && y > y2-r) return dist(x,y,x2-r,y2-r) <= r
    return true
  }
  function dist(x1,y1,x2,y2) { return Math.sqrt((x1-x2)**2+(y1-y2)**2) }

  // Scale: original SVG is 32×32, draw area is [pad, size-pad]
  const drawSize = size - pad * 2
  const S = drawSize / 32   // pixels per SVG unit

  function svgX(v) { return Math.round(pad + v * S) }
  function svgY(v) { return Math.round(pad + v * S) }

  function setAA(x, y, r, g, b, a) {
    const xi = Math.round(x), yi = Math.round(y)
    if (xi < 0 || xi >= size || yi < 0 || yi >= size) return
    const i = (yi * size + xi) * 4
    if (px[i+3] === 0) return   // skip transparent (outside rounded bg)
    const al = a / 255
    px[i]   = Math.round(px[i]   * (1-al) + r * al)
    px[i+1] = Math.round(px[i+1] * (1-al) + g * al)
    px[i+2] = Math.round(px[i+2] * (1-al) + b * al)
    px[i+3] = 255
  }

  // Draw horizontal stroke line (anti-aliased)
  function hLine(x1, x2, y, thick, R, G, B) {
    const halfT = (thick * S) / 2
    const cy = pad + y * S
    for (let px_ = svgX(x1); px_ <= svgX(x2); px_++) {
      for (let dy = -Math.ceil(halfT); dy <= Math.ceil(halfT); dy++) {
        const py_ = Math.round(cy) + dy
        const coverage = Math.min(1, halfT - Math.abs(dy) + 0.5)
        if (coverage > 0) setAA(px_, py_, R, G, B, Math.round(coverage * 255))
      }
    }
  }

  // Draw vertical stroke line (anti-aliased)
  function vLine(x, y1, y2, thick, R, G, B) {
    const halfT = (thick * S) / 2
    const cx = pad + x * S
    for (let py_ = svgY(y1); py_ <= svgY(y2); py_++) {
      for (let dx = -Math.ceil(halfT); dx <= Math.ceil(halfT); dx++) {
        const px_ = Math.round(cx) + dx
        const coverage = Math.min(1, halfT - Math.abs(dx) + 0.5)
        if (coverage > 0) setAA(px_, py_, R, G, B, Math.round(coverage * 255))
      }
    }
  }

  // Fill a rectangle
  function fillRect(x1, y1, x2, y2, R, G, B) {
    for (let py_ = svgY(y1); py_ <= svgY(y2); py_++)
      for (let px_ = svgX(x1); px_ <= svgX(x2); px_++)
        setAA(px_, py_, R, G, B, 255)
  }

  // Fill a circle
  function fillCircle(cx, cy, r, R, G, B) {
    const cxP = pad + cx * S, cyP = pad + cy * S, rP = r * S
    for (let dy = -Math.ceil(rP+1); dy <= Math.ceil(rP+1); dy++) {
      for (let dx = -Math.ceil(rP+1); dx <= Math.ceil(rP+1); dx++) {
        const d = Math.sqrt(dx*dx + dy*dy)
        const coverage = Math.min(1, rP - d + 0.5)
        if (coverage > 0)
          setAA(Math.round(cxP)+dx, Math.round(cyP)+dy, R, G, B, Math.round(coverage*255))
      }
    }
  }

  // Colors
  const W = [0xf5, 0xf5, 0xf4]   // stone-50
  const P = [0x57, 0x53, 0x4e]   // stone-600
  const C = [0xa8, 0xa2, 0x9e]   // stone-400
  const T = 1.5                   // stroke thickness in SVG units

  // Outer wallet body
  hLine(5, 27, 11, T, ...W)
  hLine(5, 27, 25, T, ...W)
  vLine(5, 11, 25, T, ...W)
  vLine(27, 11, 25, T, ...W)

  // Dividing line
  hLine(5, 27, 16, T, ...W)

  // Coin pocket
  fillRect(18.5, 18, 24.5, 22.5, ...P)

  // Coin
  fillCircle(21.5, 20.2, 1.6, ...C)

  return px
}

// ── Generate all sizes ─────────────────────────────────────────────────────────
const sizes = [
  { name: 'apple-touch-icon.png', dir: publicDir, size: 180 },
  { name: 'icon-192.png',         dir: iconsDir,  size: 192 },
  { name: 'icon-512.png',         dir: iconsDir,  size: 512 },
  { name: 'icon-512-maskable.png',dir: iconsDir,  size: 512, maskable: true },
]

for (const { name, dir, size, maskable } of sizes) {
  const pixels = drawIcon(size, { maskable: !!maskable })
  const buf    = encodePng(size, pixels)
  const out    = join(dir, name)
  writeFileSync(out, buf)
  console.log(`✓ ${out} (${buf.length} bytes)`)
}
