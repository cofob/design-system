<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { animatedChris020Sticker as asset } from "../../generated/stickers/animated-chris-020.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
