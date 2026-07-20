<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { phSilver098Sticker as asset } from "../../generated/stickers/ph-silver-098.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
