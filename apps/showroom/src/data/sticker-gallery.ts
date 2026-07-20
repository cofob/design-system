import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  AnimatedStickerAsset,
  StaticStickerAsset,
  StickerAssetIndexEntry,
  StickerPack,
} from "@cofob/design-system-stickers";

export interface StickerPackCatalog {
  version: 1;
  pack: StickerPack;
  stickers: StickerAssetIndexEntry[];
}

export type GallerySticker = StaticStickerAsset | AnimatedStickerAsset;

const catalogModules = import.meta.glob<StickerPackCatalog>(
  "../../../../packages/design-system-stickers/src/generated/catalogs/*.json",
  { eager: true, import: "default" },
);
const mediaModules = import.meta.glob<string>(
  "../../../../packages/design-system-stickers/assets/**/*.{webm,webp}",
  { eager: true, import: "default", query: "?url" },
);
const manifestRoot = path.resolve(
  process.cwd(),
  "../../packages/design-system-stickers/src/generated/manifests",
);
const assetMarker = "/packages/design-system-stickers/assets/";
const mediaUrls = new Map(
  Object.entries(mediaModules).map(([filename, url]) => {
    const markerIndex = filename.indexOf(assetMarker);
    if (markerIndex < 0) throw new Error(`Unexpected sticker media path: ${filename}`);
    return [filename.slice(markerIndex + assetMarker.length), url];
  }),
);

export function loadStickerPackCatalogs(): StickerPackCatalog[] {
  return Object.values(catalogModules).toSorted((left, right) =>
    left.pack.title.localeCompare(right.pack.title),
  );
}

export function stickerMediaUrl(sticker: Pick<StickerAssetIndexEntry, "assetPath">): string {
  const url = mediaUrls.get(sticker.assetPath);
  if (!url) throw new Error(`Sticker media is missing from the showroom build: ${sticker.assetPath}`);
  return url;
}

export async function hydrateSticker(entry: StickerAssetIndexEntry): Promise<GallerySticker> {
  if (entry.kind === "static") return entry;
  return JSON.parse(
    await readFile(path.join(manifestRoot, entry.manifestPath), "utf8"),
  ) as AnimatedStickerAsset;
}

export async function hydrateStickerPack(catalog: StickerPackCatalog): Promise<GallerySticker[]> {
  return Promise.all(catalog.stickers.map(hydrateSticker));
}
