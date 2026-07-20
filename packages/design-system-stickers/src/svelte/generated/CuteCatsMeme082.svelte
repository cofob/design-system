<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { cuteCatsMeme082Sticker as asset } from "../../generated/stickers/cute-cats-meme-082.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
