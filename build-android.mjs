import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = resolve(".");
const mimeTypes = {
  ".png": "image/png",
  ".mp3": "audio/mpeg"
};

function readText(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function toDataUri(path) {
  const filePath = resolve(root, path);
  const mime = mimeTypes[extname(filePath)] || "application/octet-stream";
  const base64 = readFileSync(filePath).toString("base64");
  return `data:${mime};base64,${base64}`;
}

function escapeScript(text) {
  return text.replaceAll("</script", "<\\/script");
}

const html = readText("index.html");
let css = readText("style.css");
const js = readText("game.js");
const vocabularyJs = readText("assets/data/vocabulary.js");
const canvasLayerAssetNames = new Set([
  "assets/layers/bg-clean.png",
  "assets/layers/regions/bg-region-grassland.png",
  "assets/layers/regions/bg-region-forest.png",
  "assets/layers/regions/bg-region-ice.png",
  "assets/layers/regions/bg-region-machine.png",
  "assets/layers/regions/bg-region-astral.png",
  "assets/layers/cannon-left.png",
  "assets/layers/cannon-right.png"
]);

css = css.replace(/url\("((?:assets|\.\/assets)\/[^"]+\.png)"\)/g, (_, assetPath) => {
  const normalizedPath = assetPath.replace(/^\.\//, "");
  if (canvasLayerAssetNames.has(normalizedPath)) {
    return `url("${normalizedPath}")`;
  }
  return `url("${toDataUri(normalizedPath)}")`;
});

const monsters = Array.from({ length: 30 }, (_, index) =>
  toDataUri(`assets/monsters/monster-${String(index).padStart(2, "0")}.png`)
);

const evolutions = Array.from({ length: 30 }, (_, index) => {
  const baby = `assets/evolutions/monster-${String(index).padStart(2, "0")}-baby.png`;
  const rookie = `assets/evolutions/monster-${String(index).padStart(2, "0")}-rookie.png`;
  const ultimate = `assets/evolutions/monster-${String(index).padStart(2, "0")}-ultimate.png`;
  return {
    baby: existsSync(resolve(root, baby)) ? toDataUri(baby) : null,
    rookie: existsSync(resolve(root, rookie)) ? toDataUri(rookie) : null,
    ultimate: existsSync(resolve(root, ultimate)) ? toDataUri(ultimate) : null
  };
});

const monsterPackStages = ["baby", "rookie", "ultimate"];
const monsterPackActions = ["idle-1", "idle-2", "entrance", "hit", "defeat", "capture", "evolution"];
const monsterPacks = Array.from({ length: 30 }, (_, index) => {
  const packedStages = {};
  for (const stage of monsterPackStages) {
    const packedActions = {};
    for (const action of monsterPackActions) {
      const path = `assets/monster-packs/monster-${String(index).padStart(2, "0")}/${stage}/${action}.png`;
      if (existsSync(resolve(root, path))) {
        packedActions[action] = toDataUri(path);
      }
    }
    if (Object.keys(packedActions).length) {
      packedStages[stage] = packedActions;
    }
  }
  return Object.keys(packedStages).length ? packedStages : null;
});

const layers = Object.fromEntries(
  [
    "bg-clean.png",
    "regions/bg-region-grassland.png",
    "regions/bg-region-forest.png",
    "regions/bg-region-ice.png",
    "regions/bg-region-machine.png",
    "regions/bg-region-astral.png",
    "cannon-left.png",
    "cannon-right.png"
  ].map((name) => [name, toDataUri(`assets/layers/${name}`)])
);

const bgmFileNames = [
  "bgm-01-title-theme.mp3",
  "bgm-02-study-manual.mp3",
  "bgm-03-sunny-grassland.mp3",
  "bgm-04-candy-forest.mp3",
  "bgm-05-crystal-ice-cave.mp3",
  "bgm-06-mechanical-city.mp3",
  "bgm-07-astral-ruins.mp3",
  "bgm-08-boss-battle.mp3"
];

const bgm = Object.fromEntries(
  bgmFileNames
    .map((name) => {
      const path = `assets/audio/bgm/${name}`;
      return existsSync(resolve(root, path)) ? [name, toDataUri(path)] : null;
    })
    .filter(Boolean)
);

const assetScript = `window.SPELL_QUEST_ASSETS = ${JSON.stringify({ monsters, evolutions, monsterPacks, layers, bgm })};`;

const androidHtml = html.replace(/<!-- PWA-START -->[\s\S]*?<!-- PWA-END -->/g, "");

const standalone = androidHtml
  .replace('<link rel="stylesheet" href="style.css">', `<style>\n${css}\n</style>`)
  .replace('src="assets/monsters/monster-00.png"', `src="${monsters[0]}"`)
  .replace('<script src="assets/data/vocabulary.js"></script>', `<script>\n${escapeScript(vocabularyJs)}\n    </script>`)
  .replace(
    '<script src="game.js"></script>',
    `<script>${escapeScript(assetScript)}</script>\n    <script>\n${escapeScript(js)}\n    </script>`
  );

writeFileSync(resolve(root, "android.html"), standalone, "utf8");
console.log(`Created android.html (${Math.round(Buffer.byteLength(standalone) / 1024)} KB)`);
