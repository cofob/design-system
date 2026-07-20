<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { animatedChris025Sticker as asset } from "../../generated/stickers/animated-chris-025.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
