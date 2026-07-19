<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Size } from "../types.js";

  interface Props extends HTMLAttributes<HTMLElement> {
    as?: "p" | "span" | "div" | "small";
    size?: Size;
    tone?: "default" | "muted" | "subtle";
    children?: Snippet;
  }

  let { as = "p", size = "md", tone = "default", children, class: className, ...rest }: Props = $props();
</script>

<svelte:element
  this={as}
  class={cx("cf-text", className)}
  data-size={size}
  data-tone={tone === "default" ? undefined : tone}
  {...rest}
>
  {@render children?.()}
</svelte:element>
