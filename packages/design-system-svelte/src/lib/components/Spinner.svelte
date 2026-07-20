<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Size } from "../types.js";

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    label?: string;
    size?: Size;
  }

  let { label = "Loading", size = "md", class: className, ...rest }: Props = $props();
</script>

<span class={cx("cf-spinner", className)} data-size={size} role="status" {...rest}>
  <span class="cf-visually-hidden">{label}</span>
</span>
