<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { animatedChris024Sticker as asset } from "../../generated/stickers/animated-chris-024.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
