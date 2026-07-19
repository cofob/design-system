<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { Size, Tone } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
    tone?: Tone;
    size?: Size;
    variant?: "soft" | "solid" | "outline";
    children?: Snippet;
  }

  let {
    tone = "neutral",
    size = "md",
    variant = "soft",
    children,
    class: className,
    ...rest
  }: Props = $props();
</script>

<span
  class={cx("cf-badge", className)}
  data-tone={tone}
  data-size={size}
  data-variant={variant === "soft" ? undefined : variant}
  {...rest}
>
  {@render children?.()}
</span>
