<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { vibeFlag030Sticker as asset } from "../../generated/stickers/vibe-flag-030.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
