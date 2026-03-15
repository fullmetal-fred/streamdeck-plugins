/**
 * Package script for ClipType Stream Deck plugin.
 *
 * Creates a .streamDeckPlugin file (ZIP archive) for distribution.
 * The Elgato Distribution Tool can also do this, but this script
 * allows automated builds.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PLUGIN_DIR = "com.fullmetalfred.cliptype.sdPlugin";
const DIST_DIR = "dist";
const OUTPUT_FILE = path.join(DIST_DIR, "com.fullmetalfred.cliptype.streamDeckPlugin");

// Ensure dist exists
fs.mkdirSync(DIST_DIR, { recursive: true });

// Remove old package if exists
if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
}

// Create ZIP (the .streamDeckPlugin format is just a ZIP)
try {
  execSync(`cd "${PLUGIN_DIR}" && zip -r "../${OUTPUT_FILE}" .`, {
    stdio: "inherit",
  });
  console.log(`\nPackaged: ${OUTPUT_FILE}`);
  console.log("Double-click this file to install in Stream Deck.");
} catch (err) {
  // Fallback for Windows (no zip command)
  console.log("zip command not found. On Windows, use the Elgato Distribution Tool:");
  console.log("https://docs.elgato.com/sdk/plugins/packaging");
  console.log(`\nOr manually ZIP the contents of ${PLUGIN_DIR}/ and rename to .streamDeckPlugin`);
}
