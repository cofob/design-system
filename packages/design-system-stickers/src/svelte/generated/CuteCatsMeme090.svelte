<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { cuteCatsMeme090Sticker as asset } from "../../generated/stickers/cute-cats-meme-090.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
