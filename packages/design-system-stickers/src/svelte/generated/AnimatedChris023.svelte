<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { animatedChris023Sticker as asset } from "../../generated/stickers/animated-chris-023.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
