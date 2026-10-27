/**
 * Copies the web app into www/ — the folder Capacitor bundles into the
 * native app (webDir in capacitor.config.json). The repo root stays the
 * canonical source so GitHub Pages keeps serving index.html directly.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');

const entries = [
  'index.html',
  'favicon.ico',
  'manifest.webmanifest',
  'sw.js',
  'libs',
  'icons'
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const entry of entries) {
  fs.cpSync(path.join(root, entry), path.join(out, entry), { recursive: true });
  console.log('copied', entry);
}
