<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    variant?: "text" | "rectangle" | "circle";
    width?: string;
    height?: string;
  }

  let { variant = "rectangle", width, height, class: className, style, ...rest }: Props = $props();
  const dimensions = $derived(
    [style, width ? `width:${width}` : "", height ? `height:${height}` : ""].filter(Boolean).join(";"),
  );
</script>

<span
  class={cx("cf-skeleton", className)}
  data-variant={variant}
  aria-hidden="true"
  style={dimensions || undefined}
  {...rest}
></span>
