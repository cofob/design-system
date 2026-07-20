<script lang="ts">
  import { Sticker } from "@cofob/design-system-svelte";
  import type { HTMLAttributes } from "svelte/elements";

  import { resolveStickerAsset } from "../shared.js";
  import type { StaticStickerAsset } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
    asset: StaticStickerAsset;
    alt: string;
    assetBaseUrl?: string;
    tone?: "accent" | "neutral" | "info" | "success" | "warning" | "danger";
    rotation?: -6 | -3 | 0 | 3 | 6;
  }

  let { asset, alt, assetBaseUrl, tone = "accent", rotation = -3, ...rest }: Props = $props();
  let src = $derived(resolveStickerAsset(asset, assetBaseUrl));
</script>

<Sticker {tone} {rotation} {...rest} data-image="true">
  <img {src} {alt} width={asset.width} height={asset.height} loading="lazy" decoding="async" />
</Sticker>
