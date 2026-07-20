import type { AnimatedStickerAsset, StickerAsset } from "./types.js";

export const DEFAULT_STICKER_ASSET_BASE = "/stickers";

export function resolveStickerAsset(
  sticker: Pick<StickerAsset, "assetPath">,
  baseUrl = DEFAULT_STICKER_ASSET_BASE,
): string {
  const base = baseUrl.replace(/\/+$/u, "");
  const assetPath = sticker.assetPath.replace(/^\/+/, "");
  return `${base}/${assetPath}`;
}

export function resolveAnimatedSticker(
  sticker: AnimatedStickerAsset,
  baseUrl = DEFAULT_STICKER_ASSET_BASE,
): AnimatedStickerModel {
  return {
    src: resolveStickerAsset(sticker, baseUrl),
    skeletonSvg: sticker.skeletonSvg,
    width: sticker.width,
    height: sticker.height,
  };
}

export interface AnimatedStickerModel {
  src: string;
  skeletonSvg: string;
  width: number;
  height: number;
}
