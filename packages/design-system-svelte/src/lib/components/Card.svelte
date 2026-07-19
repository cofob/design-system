<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLAttributes<HTMLElement>, "children"> {
    variant?: "default" | "elevated" | "outlined" | "interactive";
    padding?: "none" | "sm" | "md" | "lg";
    href?: string;
    children?: Snippet;
  }

  let { variant = "default", padding = "md", href, children, class: className, ...rest }: Props = $props();
</script>

{#if href}
  <a class={cx("cf-card", className)} data-variant={variant} data-padding={padding} {href} {...rest}>
    {@render children?.()}
  </a>
{:else}
  <div class={cx("cf-card", className)} data-variant={variant} data-padding={padding} {...rest}>
    {@render children?.()}
  </div>
{/if}
