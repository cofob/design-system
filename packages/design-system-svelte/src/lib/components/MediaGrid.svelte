<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends HTMLAttributes<HTMLElement> {
    as?: "ul" | "div";
    children?: Snippet;
  }

  let { as = "ul", children, class: className, ...rest }: Props = $props();
</script>

<svelte:element this={as} class={cx("cf-media-grid", className)} {...rest}>
  {@render children?.()}
</svelte:element>
