<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { animatedChris011Sticker as asset } from "../../generated/stickers/animated-chris-011.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
