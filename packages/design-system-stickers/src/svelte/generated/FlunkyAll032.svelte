<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { flunkyAll032Sticker as asset } from "../../generated/stickers/flunky-all-032.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
