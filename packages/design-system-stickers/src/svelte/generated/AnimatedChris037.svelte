<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { animatedChris037Sticker as asset } from "../../generated/stickers/animated-chris-037.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
