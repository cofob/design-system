<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends HTMLAttributes<HTMLElement> {
    gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
    align?: "start" | "center" | "end" | "stretch";
    children?: Snippet;
  }

  let { gap = "md", align = "stretch", children, class: className, ...rest }: Props = $props();
</script>

<div class={cx("cf-stack", className)} data-gap={gap} data-align={align} {...rest}>
  {@render children?.()}
</div>
