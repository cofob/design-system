<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { theGatesOfOrgrimmar030Sticker as asset } from "../../generated/stickers/the-gates-of-orgrimmar-030.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
