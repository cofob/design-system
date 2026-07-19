<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLTableAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLTableAttributes, "children"> {
    label: string;
    caption?: string;
    density?: "comfortable" | "compact";
    headerTone?: "strong" | "muted";
    striped?: boolean;
    minWidth?: string;
    containerClass?: string;
    children?: Snippet;
  }

  let {
    label,
    caption,
    density = "comfortable",
    headerTone = "strong",
    striped = true,
    minWidth = "36rem",
    containerClass,
    children,
    class: className,
    ...rest
  }: Props = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access for horizontally scrollable table) -->
<div
  class={cx("cf-table-container", containerClass)}
  role="region"
  aria-label={label}
  tabindex="0"
  style={`--cf-table-min-width:${minWidth}`}
>
  <table
    class={cx("cf-table", className)}
    data-density={density}
    data-header-tone={headerTone}
    data-striped={striped || undefined}
    {...rest}
  >
    {#if caption}<caption>{caption}</caption>{/if}
    {@render children?.()}
  </table>
</div>
