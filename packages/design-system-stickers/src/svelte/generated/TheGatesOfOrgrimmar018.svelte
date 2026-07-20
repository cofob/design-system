<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { theGatesOfOrgrimmar018Sticker as asset } from "../../generated/stickers/the-gates-of-orgrimmar-018.js";
  import StaticStickerAsset from "../StaticStickerAsset.svelte";

  type Props = Omit<ComponentProps<typeof StaticStickerAsset>, "asset">;
  let props: Props = $props();
</script>

<StaticStickerAsset {...props} {asset} />
