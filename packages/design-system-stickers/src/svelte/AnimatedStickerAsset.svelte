<script lang="ts">
  import { AnimatedSticker } from "@cofob/design-system-svelte";
  import type { HTMLAttributes } from "svelte/elements";

  import { resolveAnimatedSticker } from "../shared.js";
  import type { AnimatedStickerAsset } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
    asset: AnimatedStickerAsset;
    alt: string;
    assetBaseUrl?: string;
    playback?: "auto" | "static";
    preload?: "none" | "metadata" | "auto";
  }

  let { asset, alt, assetBaseUrl, playback = "auto", preload = "metadata", ...rest }: Props = $props();
  let sticker = $derived(resolveAnimatedSticker(asset, assetBaseUrl));
</script>

<AnimatedSticker {sticker} {alt} {playback} {preload} {...rest} />
