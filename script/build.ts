import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, mkdir } from "fs/promises";
import path from "path";

async function main() {
  // 1. Clean
  await rm("dist", { recursive: true, force: true });
  await mkdir("dist", { recursive: true });

  // 2. Build client with vite
  await viteBuild({
    configFile: path.resolve(import.meta.dirname, "../vite.config.ts"),
  });

  // 3. Bundle server with esbuild
  await esbuild({
    entryPoints: ["server/index.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: "dist/index.cjs",
    packages: "external",
    banner: {
      js: '"use strict";',
    },
    define: {
      "import.meta.dirname": "__dirname",
    },
  });

  console.log("Build complete!");
}

main().catch(console.error);
