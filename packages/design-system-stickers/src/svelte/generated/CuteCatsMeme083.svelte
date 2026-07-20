<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { cuteCatsMeme083Sticker as asset } from "../../generated/stickers/cute-cats-meme-083.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
