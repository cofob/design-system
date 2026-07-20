<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { flunkyAll030Sticker as asset } from "../../generated/stickers/flunky-all-030.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
