<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { flunkyAll049Sticker as asset } from "../../generated/stickers/flunky-all-049.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
