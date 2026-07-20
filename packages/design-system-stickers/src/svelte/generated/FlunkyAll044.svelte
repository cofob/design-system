<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { flunkyAll044Sticker as asset } from "../../generated/stickers/flunky-all-044.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
