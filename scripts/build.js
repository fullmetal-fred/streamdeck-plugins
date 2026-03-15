/**
 * Build script — assembles the .sdPlugin directory from source.
 *
 * 1. Builds PNG icons from SVGs
 * 2. Copies source files to plugin directory
 * 3. Copies Property Inspector
 * 4. Writes manifest.json
 */

import { cp, mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

const PLUGIN_DIR = "com.fullmetalfred.cliptype.sdPlugin";

async function main() {
  console.log("Building ClipType...");

  // Create output dirs
  await mkdir(join(PLUGIN_DIR, "imgs"), { recursive: true });
  await mkdir(join(PLUGIN_DIR, "pi"), { recursive: true });

  // 1. Build icons (import and run)
  console.log("Building icons...");
  await import("./icons.js");

  // 2. Copy source
  console.log("Copying source...");
  await cp("src", join(PLUGIN_DIR, "src"), { recursive: true });

  // 3. Copy Property Inspector
  await cp("pi/inspector.html", join(PLUGIN_DIR, "pi/inspector.html"));

  // 4. Write manifest
  const manifest = {
    Actions: [
      {
        Icon: "imgs/action",
        Name: "Type Clipboard",
        States: [
          {
            Image: "imgs/action",
            TitleAlignment: "bottom",
            FontSize: "10",
          },
        ],
        Tooltip:
          "Reads your clipboard and types it keystroke-by-keystroke. Built for remote consoles that don't support paste.",
        UUID: "com.fullmetalfred.cliptype.type",
        PropertyInspectorPath: "pi/inspector.html",
      },
    ],
    Author: "fullmetalfred",
    CodePath: "src/plugin.js",
    Description:
      "Type clipboard contents via simulated keystrokes. Built for sysadmins pasting into remote consoles.",
    Icon: "imgs/plugin",
    Name: "ClipType",
    Version: "1.0.0",
    SDKVersion: 1,
    Nodejs: {
      Version: "20",
      Debug: "enabled",
    },
    OS: [
      { Platform: "windows", MinimumVersion: "10" },
      { Platform: "mac", MinimumVersion: "10.15" },
    ],
    Software: {
      MinimumVersion: "6.0",
    },
    Category: "ClipType",
    CategoryIcon: "imgs/category",
    URL: "https://github.com/fullmetal-fred/streamdeck-plugins",
  };

  await writeFile(
    join(PLUGIN_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );

  // 5. Copy package.json for Node.js runtime
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const runtimePkg = {
    name: pkg.name,
    version: pkg.version,
    type: "module",
    main: "src/plugin.js",
    dependencies: pkg.dependencies,
  };
  await writeFile(
    join(PLUGIN_DIR, "package.json"),
    JSON.stringify(runtimePkg, null, 2),
    "utf-8"
  );

  console.log(`\nBuild complete → ${PLUGIN_DIR}/`);
  console.log('Run "pnpm package" to create .streamDeckPlugin installer.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
