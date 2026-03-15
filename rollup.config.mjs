import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import path from "node:path";
import url from "node:url";

const isWatching = !!process.env.ROLLUP_WATCH;
const sdPlugin = "com.fullmetalfred.cliptype.sdPlugin";

export default {
  input: "src/plugin.js",
  output: {
    file: `${sdPlugin}/bin/plugin.js`,
    format: "esm",
    sourcemap: isWatching,
  },
  external: ["node:child_process", "node:util", "node:fs/promises", "node:fs", "node:os", "node:path", "node:crypto", "node:buffer"],
  plugins: [
    {
      name: "watch-externals",
      buildStart() {
        this.addWatchFile(`${sdPlugin}/manifest.json`);
      },
    },
    nodeResolve({
      preferBuiltins: true,
    }),
    commonjs(),
    !isWatching && terser(),
    {
      name: "emit-module-package-file",
      generateBundle() {
        this.emitFile({
          fileName: "package.json",
          source: JSON.stringify({ type: "module" }),
          type: "asset",
        });
      },
    },
  ],
};
