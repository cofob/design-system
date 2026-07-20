<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { cuteCatsMeme084Sticker as asset } from "../../generated/stickers/cute-cats-meme-084.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
