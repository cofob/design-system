<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { theGatesOfOrgrimmar004Sticker as asset } from "../../generated/stickers/the-gates-of-orgrimmar-004.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
