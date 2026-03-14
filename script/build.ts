import { build as esbuild } from "esbuild";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  console.log("Building client...");
  execSync("npx vite build", { stdio: "inherit", cwd: path.resolve(__dirname, "..") });

  console.log("Building server...");
  await esbuild({
    entryPoints: [path.resolve(__dirname, "../server/index.ts")],
    bundle: true,
    platform: "node",
    target: "node18",
    format: "esm",
    outfile: path.resolve(__dirname, "../dist/index.js"),
    external: [
      "better-sqlite3",
      "express",
      "express-session",
    ],
    banner: {
      js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`,
    },
  });

  console.log("Build complete!");
}

build().catch(console.error);
