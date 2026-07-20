<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends HTMLAttributes<HTMLElement> {
    orientation?: "horizontal" | "vertical";
    decorative?: boolean;
  }

  let { orientation = "horizontal", decorative = false, class: className, ...rest }: Props = $props();
</script>

{#if orientation === "horizontal"}
  <hr class={cx("cf-separator", className)} aria-hidden={decorative || undefined} {...rest} />
{:else}
  <span
    class={cx("cf-separator", className)}
    role={decorative ? "none" : "separator"}
    aria-orientation={decorative ? undefined : "vertical"}
    aria-hidden={decorative || undefined}
    data-orientation="vertical"
    {...rest}
  ></span>
{/if}
