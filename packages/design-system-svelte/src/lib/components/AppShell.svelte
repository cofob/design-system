<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { children, class: className, ...rest }: Props = $props();
</script>

<div class={cx("cf-app-shell", className)} {...rest}>{@render children?.()}</div>
