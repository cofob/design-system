<script lang="ts">
  import type { HTMLAttributes, HTMLImgAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { ImageSource, Size } from "../types.js";

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    image?: ImageSource;
    name: string;
    alt?: string;
    size?: Size;
    loading?: "eager" | "lazy";
    referrerpolicy?: HTMLImgAttributes["referrerpolicy"];
  }

  let {
    image,
    name,
    alt = image?.alt ?? name,
    size = "md",
    loading = "lazy",
    referrerpolicy = "no-referrer",
    class: className,
    ...rest
  }: Props = $props();

  const initials = $derived(
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.slice(0, 1).toLocaleUpperCase())
      .join("") || "?",
  );
</script>

<span
  class={cx("cf-avatar", className)}
  data-size={size}
  role={!image && alt ? "img" : undefined}
  aria-label={!image && alt ? alt : undefined}
  aria-hidden={!alt ? "true" : undefined}
  {...rest}
>
  {#if image}
    <img
      src={image.src}
      {alt}
      width={image.width}
      height={image.height}
      srcset={image.srcSet ?? image.srcset}
      sizes={image.sizes}
      {loading}
      decoding="async"
      {referrerpolicy}
    />
  {:else}
    {initials}
  {/if}
</span>
