import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderVideoFirstFrameWebp } from "./video-first-frame.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function atomicWrite(filename, value) {
  const temporary = `${filename}.${process.pid}-${randomUUID()}.tmp`;
  await writeFile(temporary, value);
  await rename(temporary, filename);
}

async function main() {
  const manifestsRoot = path.join(root, "src", "generated", "manifests");
  const packDirectories = await readdir(manifestsRoot, { withFileTypes: true });
  const firstFrameById = new Map();
  let updated = 0;

  for (const packDirectory of packDirectories) {
    if (!packDirectory.isDirectory()) continue;
    const pack = packDirectory.name;
    const filenames = await readdir(path.join(manifestsRoot, pack));
    for (const filename of filenames) {
      if (!filename.endsWith(".json")) continue;
      const manifestPath = path.join(manifestsRoot, pack, filename);
      const sticker = JSON.parse(await readFile(manifestPath, "utf8"));
      if (sticker.kind !== "animated" || sticker.sourceFormat !== "video") continue;
      const videoPath = path.join(root, "assets", sticker.assetPath);
      const webp = await renderVideoFirstFrameWebp(videoPath);
      const hash = sha256(webp);
      const position = sticker.id.split("/").at(-1);
      const firstFrameFilename = `${position}.first-frame.${hash.slice(0, 12)}.webp`;
      const firstFrameAssetPath = `${pack}/${firstFrameFilename}`;
      await atomicWrite(path.join(root, "assets", firstFrameAssetPath), webp);
      delete sticker.skeletonSvg;
      sticker.firstFrameAssetPath = firstFrameAssetPath;
      sticker.firstFrameSrc = `/stickers/${firstFrameAssetPath}`;
      await atomicWrite(manifestPath, `${JSON.stringify(sticker, undefined, 2)}\n`);
      firstFrameById.set(sticker.id, firstFrameAssetPath);
      updated += 1;
    }
  }

  const catalogsRoot = path.join(root, "src", "generated", "catalogs");
  for (const filename of await readdir(catalogsRoot)) {
    if (!filename.endsWith(".json")) continue;
    const catalogPath = path.join(catalogsRoot, filename);
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    for (const sticker of catalog.stickers) {
      const firstFrameAssetPath = firstFrameById.get(sticker.id);
      if (firstFrameAssetPath) sticker.firstFrameAssetPath = firstFrameAssetPath;
    }
    await atomicWrite(catalogPath, `${JSON.stringify(catalog, undefined, 2)}\n`);
  }

  process.stdout.write(`Refreshed ${updated} video sticker first frames.\n`);
}

main().catch((error) => {
  process.stderr.write(
    `refresh-video-first-frames: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
