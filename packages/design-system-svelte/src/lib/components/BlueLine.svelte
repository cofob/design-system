<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
    animate?: boolean;
    rainbow?: boolean;
    children?: Snippet;
  }

  let { animate = false, rainbow = false, children, class: className, ...rest }: Props = $props();
</script>

<span
  class={cx("cf-blue-line", className)}
  data-animate={animate || undefined}
  data-rainbow={rainbow || undefined}
  {...rest}
>
  <span class="cf-blue-line__content">{@render children?.()}</span>
</span>
