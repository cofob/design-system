<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Size, Tone } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
    tone?: Tone;
    size?: Size;
    removable?: boolean;
    removeLabel?: string;
    children?: Snippet;
    onRemove?: () => void;
  }

  let {
    tone = "neutral",
    size = "md",
    removable = false,
    removeLabel = "Remove tag",
    children,
    onRemove,
    class: className,
    ...rest
  }: Props = $props();
</script>

<span class={cx("cf-tag", className)} data-tone={tone} data-size={size} {...rest}>
  {@render children?.()}
  {#if removable}
    <button type="button" class="cf-tag__remove" aria-label={removeLabel} onclick={() => onRemove?.()}
      >×</button
    >
  {/if}
</span>
