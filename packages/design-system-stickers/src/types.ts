export type StickerAssetKind = "static" | "animated";
export type AnimatedStickerSourceFormat = "tgs" | "video";

export interface StickerPack {
  key: string;
  slug: string;
  title: string;
  sourceUrl: string;
  componentPrefix: string;
  stickerCount: number;
  catalogPath: string;
}

interface StickerAssetBase {
  id: string;
  index: number;
  componentName: string;
  emoji: string;
  pack: string;
  packTitle: string;
  sourceUrl: string;
  assetPath: string;
  width: 192;
  height: 192;
  sha256: string;
}

export interface StaticStickerAsset extends StickerAssetBase {
  kind: "static";
  mediaType: "image/webp";
}

export interface AnimatedStickerAsset extends StickerAssetBase {
  kind: "animated";
  mediaType: "video/webm";
  sourceFormat: AnimatedStickerSourceFormat;
  src: string;
  skeletonSvg: string;
  fps: number;
  frameCount: number;
  duration: number;
}

export type StickerAsset = StaticStickerAsset | AnimatedStickerAsset;

export type StickerAssetIndexEntry =
  | (StaticStickerAsset & { manifestPath: string })
  | (Omit<AnimatedStickerAsset, "skeletonSvg" | "src"> & { manifestPath: string });
