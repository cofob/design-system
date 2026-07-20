<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { theGatesOfOrgrimmar002Sticker as asset } from "../../generated/stickers/the-gates-of-orgrimmar-002.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
