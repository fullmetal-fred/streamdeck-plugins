/**
 * Build script for ClipType Stream Deck plugin.
 *
 * Copies the .sdPlugin bundle into a dist/ folder, ready for packaging
 * or manual installation.
 */

const fs = require("fs");
const path = require("path");

const PLUGIN_DIR = "com.fullmetalfred.cliptype.sdPlugin";
const DIST_DIR = "dist";

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Clean dist
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true });
}

// Copy plugin bundle to dist
const destPlugin = path.join(DIST_DIR, PLUGIN_DIR);
copyRecursive(PLUGIN_DIR, destPlugin);

console.log(`Built plugin to ${destPlugin}`);
console.log(
  "To install: copy the .sdPlugin folder to your Stream Deck plugins directory."
);
