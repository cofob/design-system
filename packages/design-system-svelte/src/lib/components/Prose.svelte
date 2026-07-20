<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends HTMLAttributes<HTMLElement> {
    size?: "narrow" | "default" | "full";
    children?: Snippet;
  }

  let { size = "narrow", children, class: className, ...rest }: Props = $props();
</script>

<div class={cx("cf-prose", className)} data-size={size} {...rest}>{@render children?.()}</div>
