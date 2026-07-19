<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Tone } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
    tone?: Tone;
    rotation?: -6 | -3 | 0 | 3 | 6;
    children?: Snippet;
  }

  let { tone = "accent", rotation = -3, children, class: className, style, ...rest }: Props = $props();
</script>

<span
  class={cx("cf-sticker", className)}
  data-tone={tone}
  style={`--cf-sticker-rotation:${rotation}deg;${style ?? ""}`}
  {...rest}
>
  {@render children?.()}
</span>
