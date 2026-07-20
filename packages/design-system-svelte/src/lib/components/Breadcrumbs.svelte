<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";

  interface BreadcrumbItem {
    label: string;
    href?: string;
    current?: boolean;
  }

  interface Props extends HTMLAttributes<HTMLElement> {
    items: readonly BreadcrumbItem[];
    label?: string;
  }

  let { items, label = "Breadcrumb", class: className, ...rest }: Props = $props();
</script>

<nav class={cx("cf-breadcrumbs", className)} aria-label={label} {...rest}>
  <ol class="cf-breadcrumbs__list">
    {#each items as item, index (`${index}-${item.href ?? "current"}`)}
      {@const current = item.current ?? index === items.length - 1}
      <li class="cf-breadcrumbs__item">
        {#if item.href && !current}
          <a class="cf-breadcrumbs__link" href={item.href}>{item.label}</a>
        {:else}
          <span aria-current={current ? "page" : undefined}>{item.label}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
