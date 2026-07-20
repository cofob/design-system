<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { manedDerpAnimated015Sticker as asset } from "../../generated/stickers/maned-derp-animated-015.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
