import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(".");
const outDir = resolve(root, "dist");
const sourceFiles = [
  "index.html",
  "style.css",
  "game.js",
  "pwa.js",
  "service-worker.js",
  "manifest.webmanifest",
  "assets"
];

function copyTree(sourcePath, targetPath) {
  if (statSync(sourcePath).isDirectory()) {
    mkdirSync(targetPath, { recursive: true });
    for (const entry of readdirSync(sourcePath)) {
      copyTree(resolve(sourcePath, entry), resolve(targetPath, entry));
    }
    return;
  }
  mkdirSync(resolve(targetPath, ".."), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const source of sourceFiles) {
  const sourcePath = resolve(root, source);
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing PWA source: ${source}`);
  }
  copyTree(sourcePath, resolve(outDir, source));
}

writeFileSync(resolve(outDir, ".nojekyll"), "", "utf8");
console.log(`Created PWA build at ${outDir}`);
