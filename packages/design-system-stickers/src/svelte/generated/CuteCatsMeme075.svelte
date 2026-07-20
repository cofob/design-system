<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { cuteCatsMeme075Sticker as asset } from "../../generated/stickers/cute-cats-meme-075.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
