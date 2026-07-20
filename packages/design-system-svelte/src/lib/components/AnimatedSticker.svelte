<script lang="ts">
  import { onMount } from "svelte";
  import type { HTMLAttributes, HTMLVideoAttributes } from "svelte/elements";
  import { createAnimatedStickerController } from "@cofob/design-system-css";
  import { cx } from "../internal.js";
  import type { AnimatedStickerModel } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
    sticker: AnimatedStickerModel;
    alt: string;
    playback?: "auto" | "static";
    preload?: HTMLVideoAttributes["preload"];
  }

  let { sticker, alt, playback = "auto", preload = "metadata", class: className, ...rest }: Props = $props();
  let root: HTMLSpanElement;

  onMount(() => {
    const controller = createAnimatedStickerController(root);
    return () => controller.destroy();
  });
</script>

<span
  {...rest}
  bind:this={root}
  class={cx("cf-animated-sticker", className)}
  data-cf-animated-sticker
  data-cf-animated-sticker-managed="true"
  data-playback={playback}
  data-state={playback === "static" ? "static" : "loading"}
  role="img"
  aria-label={alt}
>
  <span class="cf-animated-sticker__skeleton" aria-hidden="true">
    <!-- skeletonSvg must come from the trusted @cofob/design-system-assets converter. -->
    {@html sticker.skeletonSvg}
  </span>
  {#if playback === "auto"}
    <video
      data-cf-animated-sticker-video
      data-cf-animated-sticker-src={sticker.src}
      width={sticker.width}
      height={sticker.height}
      muted
      loop
      playsinline
      {preload}
      aria-hidden="true"
      tabindex="-1"
    ></video>
  {/if}
</span>
