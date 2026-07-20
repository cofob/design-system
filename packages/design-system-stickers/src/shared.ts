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
  const base = {
    src: resolveStickerAsset(sticker, baseUrl),
    width: sticker.width,
    height: sticker.height,
  };
  return sticker.sourceFormat === "tgs"
    ? { ...base, skeletonSvg: sticker.skeletonSvg }
    : {
        ...base,
        firstFrameSrc: resolveStickerAsset({ assetPath: sticker.firstFrameAssetPath }, baseUrl),
      };
}

interface AnimatedStickerModelBase {
  src: string;
  width: number;
  height: number;
}

export type AnimatedStickerModel = AnimatedStickerModelBase &
  ({ skeletonSvg: string; firstFrameSrc?: never } | { skeletonSvg?: never; firstFrameSrc: string });
