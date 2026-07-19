<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLImgAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { ImageSource } from "../types.js";

  interface Props extends Omit<HTMLImgAttributes, "src" | "alt" | "width" | "height" | "srcset" | "sizes"> {
    image: ImageSource;
    darkImage?: ImageSource;
    aspectRatio?: string;
    fit?: "cover" | "contain" | "fill";
    priority?: boolean;
    caption?: string | Snippet;
  }

  let {
    image,
    darkImage,
    aspectRatio,
    fit = "cover",
    priority = false,
    caption,
    class: className,
    style,
    ...rest
  }: Props = $props();

  const figureStyle = $derived(
    [aspectRatio ? `--cf-image-aspect:${aspectRatio}` : "", `--cf-image-fit:${fit}`, style ?? ""]
      .filter(Boolean)
      .join(";"),
  );
</script>

<figure
  class={cx("cf-responsive-image", className)}
  data-has-dark-image={darkImage ? "true" : undefined}
  style={figureStyle}
>
  <span class="cf-responsive-image__media">
    <img
      class="cf-responsive-image__light"
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      srcset={image.srcSet ?? image.srcset}
      sizes={image.sizes}
      loading={priority ? "eager" : "lazy"}
      fetchpriority={priority ? "high" : "auto"}
      {...rest}
    />
    {#if darkImage}
      <img
        class="cf-responsive-image__dark"
        src={darkImage.src}
        alt={darkImage.alt}
        width={darkImage.width}
        height={darkImage.height}
        srcset={darkImage.srcSet ?? darkImage.srcset}
        sizes={darkImage.sizes ?? image.sizes}
        loading={priority ? "eager" : "lazy"}
        fetchpriority={priority ? "high" : "auto"}
        {...rest}
      />
    {/if}
  </span>
  {#if caption}
    <figcaption>
      {#if typeof caption === "string"}{caption}{:else}{@render caption()}{/if}
    </figcaption>
  {/if}
</figure>
