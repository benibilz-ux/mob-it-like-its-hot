// Generates app icon PNG files from the pitchdeck house design.
// Design source: Design/design_handoff_mobile_redesign/Pitchdeck.dc.html (section "App-Icon")
//
// 340px design space coordinates (absolute, within 340×340 container):
//   Roof triangle: (84,108) → (172,50) → (260,108)  [upward triangle, blue]
//   House body:    x=88, y=108, w=164, h=130          [blue rect]
//   Door:          x=153, y=146, w=34, h=92, r=5      [paper rect, top-rounded]
//
// Run: node scripts/generate-icon.js

const sharp = require('sharp');
const path = require('path');

const BLUE  = '#2A46D6';
const PAPER = '#FDFCF9';
const OUT   = path.join(__dirname, '..', 'assets', 'images');

// Scales 340-space coordinates to target size, centered.
function makeIconSvg(size) {
  const S = size / 340;
  const t = (n) => n * S;

  const roofPts  = `${t(84)},${t(108)} ${t(172)},${t(50)} ${t(260)},${t(108)}`;
  const [hx, hy, hw, hh] = [t(88), t(108), t(164), t(130)];
  const [dx, dy, dw, dr]  = [t(153), t(146), t(34), t(5)];
  const dh = t(238) - t(146); // bottom aligned with house body

  const doorPath =
    `M ${dx},${dy + dh} ` +
    `L ${dx},${dy + dr} Q ${dx},${dy} ${dx + dr},${dy} ` +
    `L ${dx + dw - dr},${dy} Q ${dx + dw},${dy} ${dx + dw},${dy + dr} ` +
    `L ${dx + dw},${dy + dh} Z`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${PAPER}"/>
  <polygon points="${roofPts}" fill="${BLUE}"/>
  <rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" fill="${BLUE}"/>
  <path d="${doorPath}" fill="${PAPER}"/>
</svg>`;
}

// Foreground for Android adaptive icon: house centered in safe zone, transparent bg.
function makeForegroundSvg(size) {
  // House bounding box in 340-absolute coords
  const houseCX = 172, houseCY = 144; // center of (84..260, 50..238)
  const houseH  = 188; // 238 - 50

  const safeSize = size * 0.66;
  const scale    = safeSize / houseH;
  const cx = size / 2;
  const cy = size / 2;

  const tx = (x) => cx + (x - houseCX) * scale;
  const ty = (y) => cy + (y - houseCY) * scale;
  const ts = (s) => s * scale;

  const roofPts  = `${tx(84)},${ty(108)} ${tx(172)},${ty(50)} ${tx(260)},${ty(108)}`;
  const [hx, hy, hw, hh] = [tx(88), ty(108), ts(164), ts(130)];
  const [dx, dy, dw, dr]  = [tx(153), ty(146), ts(34), ts(5)];
  const dh = ty(238) - ty(146);

  const doorPath =
    `M ${dx},${dy + dh} ` +
    `L ${dx},${dy + dr} Q ${dx},${dy} ${dx + dr},${dy} ` +
    `L ${dx + dw - dr},${dy} Q ${dx + dw},${dy} ${dx + dw},${dy + dr} ` +
    `L ${dx + dw},${dy + dh} Z`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <polygon points="${roofPts}" fill="${BLUE}"/>
  <rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" fill="${BLUE}"/>
  <path d="${doorPath}" fill="${PAPER}"/>
</svg>`;
}

async function main() {
  // icon.png must be fully opaque — flatten() removes the alpha channel
  const iconSvg = makeIconSvg(1024);
  await sharp(Buffer.from(iconSvg)).flatten({ background: '#FDFCF9' }).png().toFile(`${OUT}/icon.png`);
  console.log('✓ icon.png');

  // Foreground keeps alpha (transparent bg is correct for adaptive icons)
  const fgSvg = makeForegroundSvg(1024);
  await sharp(Buffer.from(fgSvg)).png().toFile(`${OUT}/android-icon-foreground.png`);
  console.log('✓ android-icon-foreground.png');

  // Splash icon must also be opaque
  const splashSvg = makeIconSvg(512);
  await sharp(Buffer.from(splashSvg)).flatten({ background: '#FDFCF9' }).png().toFile(`${OUT}/splash-icon.png`);
  console.log('✓ splash-icon.png');
}

main().catch(console.error);
