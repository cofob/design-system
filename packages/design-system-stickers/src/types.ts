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

interface AnimatedStickerAssetBase extends StickerAssetBase {
  kind: "animated";
  mediaType: "video/webm";
  src: string;
  fps: number;
  frameCount: number;
  duration: number;
}

export interface VectorAnimatedStickerAsset extends AnimatedStickerAssetBase {
  sourceFormat: "tgs";
  skeletonSvg: string;
}

export interface VideoAnimatedStickerAsset extends AnimatedStickerAssetBase {
  sourceFormat: "video";
  firstFrameAssetPath: string;
  firstFrameSrc: string;
}

export type AnimatedStickerAsset = VectorAnimatedStickerAsset | VideoAnimatedStickerAsset;

export type StickerAsset = StaticStickerAsset | AnimatedStickerAsset;

export type StickerAssetIndexEntry =
  | (StaticStickerAsset & { manifestPath: string })
  | (Omit<VectorAnimatedStickerAsset, "skeletonSvg" | "src"> & { manifestPath: string })
  | (Omit<VideoAnimatedStickerAsset, "firstFrameSrc" | "src"> & { manifestPath: string });
