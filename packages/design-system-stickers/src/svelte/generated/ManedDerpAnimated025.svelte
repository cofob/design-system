<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { manedDerpAnimated025Sticker as asset } from "../../generated/stickers/maned-derp-animated-025.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
