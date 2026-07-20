<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { phSilver058Sticker as asset } from "../../generated/stickers/ph-silver-058.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
