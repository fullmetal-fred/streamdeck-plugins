/**
 * Package the plugin into a .streamDeckPlugin file.
 *
 * A .streamDeckPlugin file is just a ZIP with a different extension.
 * Double-clicking it installs the plugin in Stream Deck.
 *
 * Uses a pure-Node ZIP writer — no `zip` binary required.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { readdir, mkdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";
import { Buffer } from "node:buffer";

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

  await mkdir("release", { recursive: true });

  // Collect all files
  const files = await walk(PLUGIN_DIR);
  const filtered = files.filter(
    (f) => !f.includes(".DS_Store") && !f.includes("__MACOSX")
  );

  console.log(`Zipping ${filtered.length} files...`);

  const zip = new ZipWriter();
  for (const absPath of filtered) {
    const relPath = relative(PLUGIN_DIR, absPath);
    const content = readFileSync(absPath);
    zip.addFile(relPath, content);
  }

  writeFileSync(OUTPUT, zip.finish());

  console.log(`\nPackaged → ${OUTPUT}`);
  console.log("Double-click to install in Stream Deck.");
}

// ─── Minimal ZIP writer (store method, no compression) ───────────────

class ZipWriter {
  #entries = [];
  #parts = [];
  #offset = 0;

  addFile(name, content) {
    const nameBytes = Buffer.from(name, "utf-8");
    const crc = crc32(content);

    const headerSize = 30 + nameBytes.length;
    const header = Buffer.alloc(headerSize);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(content.length, 18);
    header.writeUInt32LE(content.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    header.writeUInt16LE(0, 28);
    nameBytes.copy(header, 30);

    this.#entries.push({
      name: nameBytes,
      crc,
      size: content.length,
      offset: this.#offset,
    });

    this.#parts.push(header, content);
    this.#offset += headerSize + content.length;
  }

  finish() {
    const centralStart = this.#offset;

    for (const entry of this.#entries) {
      const cdSize = 46 + entry.name.length;
      const cd = Buffer.alloc(cdSize);
      cd.writeUInt32LE(0x02014b50, 0);
      cd.writeUInt16LE(20, 4);
      cd.writeUInt16LE(20, 6);
      cd.writeUInt16LE(0, 8);
      cd.writeUInt16LE(0, 10);
      cd.writeUInt16LE(0, 12);
      cd.writeUInt16LE(0, 14);
      cd.writeUInt32LE(entry.crc, 16);
      cd.writeUInt32LE(entry.size, 20);
      cd.writeUInt32LE(entry.size, 24);
      cd.writeUInt16LE(entry.name.length, 28);
      cd.writeUInt16LE(0, 30);
      cd.writeUInt16LE(0, 32);
      cd.writeUInt16LE(0, 34);
      cd.writeUInt16LE(0, 36);
      cd.writeUInt32LE(0, 38);
      cd.writeUInt32LE(entry.offset, 42);
      entry.name.copy(cd, 46);

      this.#parts.push(cd);
      this.#offset += cdSize;
    }

    const centralSize = this.#offset - centralStart;

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(this.#entries.length, 8);
    eocd.writeUInt16LE(this.#entries.length, 10);
    eocd.writeUInt32LE(centralSize, 12);
    eocd.writeUInt32LE(centralStart, 16);
    eocd.writeUInt16LE(0, 20);
    this.#parts.push(eocd);

    return Buffer.concat(this.#parts);
  }
}

// ─── CRC-32 ──────────────────────────────────────────────────────────

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ─── Directory walker ────────────────────────────────────────────────

async function walk(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walk(full)));
    } else {
      results.push(full);
    }
  }
  return results;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
