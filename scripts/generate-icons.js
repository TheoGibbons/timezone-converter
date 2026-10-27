/**
 * Generates all app icons from the globe line-art of timezone_logo_minimal.svg:
 *  - icons/            PWA icons referenced by manifest.webmanifest
 *  - assets/           source images for `npx @capacitor/assets generate --android`
 *                      (Android launcher icons + splash screens)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BRAND_BLUE = '#3498db';

/**
 * Square globe icon SVG (globe with meridians + clock hands, from the project logo).
 *
 * @param {number} size   canvas size in px
 * @param {number} r      globe radius in px
 * @param {string} stroke line color
 * @param {string|null} bg background color, or null for transparent
 * @return {Buffer}
 */
function globeSvg(size, r, stroke, bg) {
  const c = size / 2;
  const outerW = r * 0.052;
  const innerW = r * 0.03;
  const handW = r * 0.1;
  const dotR = r * 0.11;
  // Clock hands, same angles as the logo (dx/dy relative to a radius of 90)
  const h1x = c + r * (40 / 90), h1y = c - r * (38 / 90);
  const h2x = c - r * (38 / 90), h2y = c + r * (40 / 90);

  return Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
  <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${outerW}"/>
  <ellipse cx="${c}" cy="${c}" rx="${r * (31 / 90)}" ry="${r}" fill="none" stroke="${stroke}" stroke-width="${innerW}"/>
  <ellipse cx="${c}" cy="${c}" rx="${r * (62 / 90)}" ry="${r}" fill="none" stroke="${stroke}" stroke-width="${innerW}"/>
  <line x1="${c - r}" y1="${c}" x2="${c + r}" y2="${c}" stroke="${stroke}" stroke-width="${innerW}"/>
  <line x1="${c}" y1="${c}" x2="${h1x}" y2="${h1y}" stroke="${stroke}" stroke-width="${handW}" stroke-linecap="round"/>
  <line x1="${c}" y1="${c}" x2="${h2x}" y2="${h2y}" stroke="${stroke}" stroke-width="${handW}" stroke-linecap="round"/>
  <circle cx="${c}" cy="${c}" r="${dotR}" fill="${stroke}"/>
</svg>`);
}

async function render(svg, outFile) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await sharp(svg).png().toFile(outFile);
  console.log('wrote', outFile);
}

(async () => {
  const root = path.join(__dirname, '..');
  const icons = (f) => path.join(root, 'icons', f);
  const assets = (f) => path.join(root, 'assets', f);

  // PWA icons (manifest.webmanifest)
  await render(globeSvg(192, 61, '#ffffff', BRAND_BLUE), icons('icon-192.png'));
  await render(globeSvg(512, 164, '#ffffff', BRAND_BLUE), icons('icon-512.png'));
  // Maskable: content must sit inside the centre safe zone
  await render(globeSvg(512, 133, '#ffffff', BRAND_BLUE), icons('icon-maskable-512.png'));

  // @capacitor/assets sources
  await render(globeSvg(1024, 328, '#ffffff', BRAND_BLUE), assets('icon-only.png'));
  // Adaptive icon: foreground content inside centre ~60% (launcher masks the rest)
  await render(globeSvg(1024, 260, '#ffffff', null), assets('icon-foreground.png'));
  await render(globeSvg(1024, 0, '#ffffff', BRAND_BLUE), assets('icon-background.png'));
  await render(globeSvg(2732, 400, '#ffffff', BRAND_BLUE), assets('splash.png'));
  await render(globeSvg(2732, 400, '#ffffff', BRAND_BLUE), assets('splash-dark.png'));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
