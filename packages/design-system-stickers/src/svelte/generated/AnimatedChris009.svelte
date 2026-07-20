<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { animatedChris009Sticker as asset } from "../../generated/stickers/animated-chris-009.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
