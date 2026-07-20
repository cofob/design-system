<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { vibeFlag029Sticker as asset } from "../../generated/stickers/vibe-flag-029.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
