<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends HTMLAnchorAttributes {
    external?: boolean;
    underline?: "always" | "hover" | "none";
    children?: Snippet;
  }

  let {
    href,
    external = false,
    underline = "always",
    children,
    class: className,
    target,
    rel,
    ...rest
  }: Props = $props();

  const isExternal = $derived(external || Boolean(href && /^(https?:)?\/\//.test(href)));
</script>

<a
  {href}
  class={cx("cf-link", className)}
  data-underline={underline}
  target={target ?? (external ? "_blank" : undefined)}
  rel={rel ?? (external ? "noreferrer" : undefined)}
  {...rest}
>
  {@render children?.()}
  {#if isExternal}<span class="cf-link__external" aria-hidden="true">↗</span>{/if}
</a>
