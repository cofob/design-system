<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { phSilver023Sticker as asset } from "../../generated/stickers/ph-silver-023.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
