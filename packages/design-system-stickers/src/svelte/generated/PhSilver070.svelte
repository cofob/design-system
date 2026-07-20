<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { phSilver070Sticker as asset } from "../../generated/stickers/ph-silver-070.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
