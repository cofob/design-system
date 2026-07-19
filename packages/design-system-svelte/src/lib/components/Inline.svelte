<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends HTMLAttributes<HTMLElement> {
    gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
    align?: "start" | "center" | "end" | "baseline" | "stretch";
    justify?: "start" | "center" | "end" | "between";
    wrap?: boolean;
    children?: Snippet;
  }

  let {
    gap = "md",
    align = "center",
    justify = "start",
    wrap = true,
    children,
    class: className,
    ...rest
  }: Props = $props();
</script>

<div
  class={cx("cf-inline", className)}
  data-gap={gap}
  data-align={align}
  data-justify={justify}
  data-wrap={wrap}
  {...rest}
>
  {@render children?.()}
</div>
