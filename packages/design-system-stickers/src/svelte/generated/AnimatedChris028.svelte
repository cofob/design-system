<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { animatedChris028Sticker as asset } from "../../generated/stickers/animated-chris-028.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
