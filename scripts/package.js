/**
 * Package the plugin into a .streamDeckPlugin file.
 *
 * A .streamDeckPlugin file is just a ZIP with a different extension.
 * Double-clicking it installs the plugin in Stream Deck.
 */

import { createWriteStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import { execSync } from "node:child_process";

const PLUGIN_DIR = "com.fullmetalfred.cliptype.sdPlugin";
const OUTPUT = "release/com.fullmetalfred.cliptype.streamDeckPlugin";

async function main() {
  console.log("Packaging ClipType...");

  // Install runtime deps in plugin dir
  console.log("Installing runtime dependencies...");
  execSync("npm install --omit=dev", {
    cwd: PLUGIN_DIR,
    stdio: "inherit",
  });

  // Create release dir
  execSync("mkdir -p release");

  // Use system zip (available on macOS and most dev environments)
  // Stream Deck expects a zip file with .streamDeckPlugin extension
  execSync(
    `cd ${PLUGIN_DIR} && zip -r "../${OUTPUT}" . -x "*.DS_Store" -x "__MACOSX/*"`,
    { stdio: "inherit" }
  );

  console.log(`\nPackaged → ${OUTPUT}`);
  console.log("Double-click to install in Stream Deck.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
