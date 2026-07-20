<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { phSilver095Sticker as asset } from "../../generated/stickers/ph-silver-095.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
