/**
 * Convert SVG icons to PNGs at required Stream Deck sizes.
 *
 * Stream Deck expects:
 *   action icon:   20x20 (@1x) and 40x40 (@2x)
 *   plugin icon:   72x72 (@1x) and 144x144 (@2x)
 *   category icon: 28x28 (@1x) and 56x56 (@2x)
 */

import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { join, basename, extname } from "node:path";

const ASSETS_DIR = "assets/icons";
const OUT_DIR = "com.fullmetalfred.cliptype.sdPlugin/imgs";

const ICON_SIZES = {
  action: [
    { suffix: "", size: 20 },
    { suffix: "@2x", size: 40 },
  ],
  plugin: [
    { suffix: "", size: 72 },
    { suffix: "@2x", size: 144 },
  ],
  category: [
    { suffix: "", size: 28 },
    { suffix: "@2x", size: 56 },
  ],
};

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = await readdir(ASSETS_DIR);
  const svgs = files.filter((f) => extname(f) === ".svg");

  for (const svg of svgs) {
    const name = basename(svg, ".svg");
    const sizes = ICON_SIZES[name];

    if (!sizes) {
      console.warn(`No size config for ${name}, skipping`);
      continue;
    }

    for (const { suffix, size } of sizes) {
      const outPath = join(OUT_DIR, `${name}${suffix}.png`);
      await sharp(join(ASSETS_DIR, svg))
        .resize(size, size)
        .png()
        .toFile(outPath);
      console.log(`  ${outPath} (${size}x${size})`);
    }
  }

  console.log("Icons built.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
