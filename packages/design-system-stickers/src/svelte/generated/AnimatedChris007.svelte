<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { animatedChris007Sticker as asset } from "../../generated/stickers/animated-chris-007.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
