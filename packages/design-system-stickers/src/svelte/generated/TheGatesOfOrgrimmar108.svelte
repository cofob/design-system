<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { theGatesOfOrgrimmar108Sticker as asset } from "../../generated/stickers/the-gates-of-orgrimmar-108.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
