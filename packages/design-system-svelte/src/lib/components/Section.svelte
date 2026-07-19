<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface Props extends HTMLAttributes<HTMLElement> {
    eyebrow?: string;
    title?: string;
    description?: string;
    children?: Snippet;
  }

  let { eyebrow, title, description, children, class: className, ...rest }: Props = $props();
</script>

<section class={cx("cf-section", className)} {...rest}>
  {#if eyebrow || title || description}
    <header class="cf-section__header">
      {#if eyebrow}<p class="cf-section__eyebrow">{eyebrow}</p>{/if}
      {#if title}<h2 class="cf-heading" data-size="xl">{title}</h2>{/if}
      {#if description}<p class="cf-text" data-tone="muted">{description}</p>{/if}
    </header>
  {/if}
  {@render children?.()}
</section>
