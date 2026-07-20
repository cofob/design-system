<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { flunkyAll006Sticker as asset } from "../../generated/stickers/flunky-all-006.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
