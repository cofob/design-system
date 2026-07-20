<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { phSilver038Sticker as asset } from "../../generated/stickers/ph-silver-038.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
