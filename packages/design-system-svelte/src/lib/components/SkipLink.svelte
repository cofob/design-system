<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cx } from "../internal.js";

  interface Props extends HTMLAnchorAttributes {
    children?: Snippet;
  }

  let { href = "#main-content", children, class: className, ...rest }: Props = $props();
</script>

<a {href} class={cx("cf-skip-link", className)} {...rest}>
  {#if children}{@render children()}{:else}Skip to content{/if}
</a>
