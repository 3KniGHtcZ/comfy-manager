/**
 * Generates PWA icon PNGs from an SVG template using sharp.
 * Run once: node scripts/generate-icons.mjs
 * Outputs: public/icons/icon-192.png, icon-512.png, apple-touch-icon.png
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')

function makeSvg(size) {
  const radius = Math.round(size * 0.2)
  const pad = Math.round(size * 0.18)
  const fontSize = Math.round(size * 0.48)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#3D8A5A"/>
  <text
    x="50%" y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-weight="700"
    font-size="${fontSize}"
    fill="white"
    dy="${Math.round(size * 0.02)}"
  >C</text>
</svg>`
}

async function generate(size, filename) {
  const svg = Buffer.from(makeSvg(size))
  await sharp(svg).png().toFile(join(outDir, filename))
  console.log(`✓ ${filename} (${size}×${size})`)
}

await generate(192, 'icon-192.png')
await generate(512, 'icon-512.png')
await generate(180, 'apple-touch-icon.png')

console.log('Icons generated in public/icons/')
