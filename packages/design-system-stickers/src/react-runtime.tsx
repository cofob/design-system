import {
  AnimatedSticker,
  type AnimatedStickerProps,
  Sticker,
  type StickerProps,
} from "@cofob/design-system-react";
import type { ReactElement } from "react";

import { resolveAnimatedSticker, resolveStickerAsset } from "./shared.js";
import type { AnimatedStickerAsset, StaticStickerAsset } from "./types.js";

export interface StaticStickerComponentProps extends Omit<StickerProps, "children"> {
  alt: string;
  assetBaseUrl?: string;
}

export interface AnimatedStickerComponentProps extends Omit<AnimatedStickerProps, "sticker"> {
  assetBaseUrl?: string;
}

export interface GeneratedStaticStickerComponent {
  (props: StaticStickerComponentProps): ReactElement;
  asset: StaticStickerAsset;
}

export interface GeneratedAnimatedStickerComponent {
  (props: AnimatedStickerComponentProps): ReactElement;
  asset: AnimatedStickerAsset;
}

export function createStaticStickerComponent(asset: StaticStickerAsset): GeneratedStaticStickerComponent {
  function StaticStickerComponent({ alt, assetBaseUrl, ...props }: StaticStickerComponentProps) {
    return (
      <Sticker {...props} data-image="true">
        <img
          src={resolveStickerAsset(asset, assetBaseUrl)}
          alt={alt}
          width={asset.width}
          height={asset.height}
          loading="lazy"
          decoding="async"
        />
      </Sticker>
    );
  }
  StaticStickerComponent.asset = asset;
  return StaticStickerComponent;
}

export function createAnimatedStickerComponent(
  asset: AnimatedStickerAsset,
): GeneratedAnimatedStickerComponent {
  function AnimatedStickerComponent({ assetBaseUrl, ...props }: AnimatedStickerComponentProps) {
    return <AnimatedSticker {...props} sticker={resolveAnimatedSticker(asset, assetBaseUrl)} />;
  }
  AnimatedStickerComponent.asset = asset;
  return AnimatedStickerComponent;
}
