<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Size } from "../types.js";

  interface Props extends HTMLAttributes<HTMLElement> {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    size?: Size | "xl" | "2xl";
    children?: Snippet;
  }

  let { as = "h2", size = "lg", children, class: className, ...rest }: Props = $props();
</script>

<svelte:element this={as} class={cx("cf-heading", className)} data-size={size} {...rest}>
  {@render children?.()}
</svelte:element>
