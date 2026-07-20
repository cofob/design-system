<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { nyyyyyyb020Sticker as asset } from "../../generated/stickers/nyyyyyyb-020.js";
  import AnimatedStickerAsset from "../AnimatedStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof AnimatedStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<AnimatedStickerAsset {...props} {asset} />
