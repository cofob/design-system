<script lang="ts">
  import type { HTMLImgAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { ImageSource } from "../types.js";

  interface Props extends Omit<HTMLImgAttributes, "src" | "alt" | "width" | "height" | "srcset" | "sizes"> {
    image: ImageSource;
    alt?: string;
  }

  let {
    image,
    alt = image.alt,
    class: className,
    loading = "lazy",
    referrerpolicy = "no-referrer",
    ...rest
  }: Props = $props();
</script>

<img
  class={cx("cf-inline-emoji", className)}
  src={image.src}
  {alt}
  width={image.width}
  height={image.height}
  srcset={image.srcSet ?? image.srcset}
  sizes={image.sizes}
  {loading}
  decoding="async"
  {referrerpolicy}
  {...rest}
/>
