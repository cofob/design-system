<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { cuteCatsMeme064Sticker as asset } from "../../generated/stickers/cute-cats-meme-064.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
