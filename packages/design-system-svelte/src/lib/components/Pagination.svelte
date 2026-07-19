<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { PaginationItem } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLElement>, "children"> {
    page?: number;
    totalPages?: number;
    items?: PaginationItem[];
    getHref?: (page: number) => string;
    siblingCount?: number;
    label?: string;
    onPageChange?: (page: number) => void;
  }

  let {
    page = $bindable(1),
    totalPages = 1,
    items,
    getHref,
    siblingCount = 1,
    label = "Pagination",
    onPageChange,
    class: className,
    ...rest
  }: Props = $props();

  const pages = $derived.by((): PaginationItem[] => {
    if (items) return items;
    const visible = new Set([1, totalPages]);
    for (let value = page - siblingCount; value <= page + siblingCount; value += 1) {
      if (value > 0 && value <= totalPages) visible.add(value);
    }
    return [...visible]
      .sort((a, b) => a - b)
      .map((value) => {
        const generated: PaginationItem = { page: value };
        const href = getHref?.(value);
        if (href) generated.href = href;
        return generated;
      });
  });
  const lastPage = $derived(
    items?.length ? Math.max(totalPages, ...items.map((item) => item.page)) : totalPages,
  );

  function select(next: number, event?: MouseEvent) {
    if (next < 1 || next > lastPage || next === page) return;
    if (!getHref && !items?.find((item) => item.page === next)?.href) event?.preventDefault();
    page = next;
    onPageChange?.(next);
  }
</script>

<nav class={cx("cf-pagination", className)} aria-label={label} {...rest}>
  {#if getHref && page > 1}
    <a class="cf-pagination__link" href={getHref(page - 1)} onclick={(event) => select(page - 1, event)}
      >Previous</a
    >
  {:else}
    <button
      type="button"
      class="cf-pagination__link"
      disabled={page <= 1}
      onclick={(event) => select(page - 1, event)}>Previous</button
    >
  {/if}
  {#each pages as item, index (item.page)}
    {#if index > 0 && item.page - pages[index - 1]!.page > 1}
      <span class="cf-pagination__ellipsis" aria-hidden="true">…</span>
    {/if}
    {#if item.href}
      <a
        class="cf-pagination__link"
        href={item.href}
        aria-current={item.page === page ? "page" : undefined}
        aria-label={item.label ? undefined : `Page ${item.page}`}
        onclick={(event) => select(item.page, event)}>{item.label ?? item.page}</a
      >
    {:else}
      <button
        type="button"
        class="cf-pagination__link"
        aria-current={item.page === page ? "page" : undefined}
        aria-label={item.label ? undefined : `Page ${item.page}`}
        onclick={(event) => select(item.page, event)}>{item.label ?? item.page}</button
      >
    {/if}
  {/each}
  {#if getHref && page < lastPage}
    <a class="cf-pagination__link" href={getHref(page + 1)} onclick={(event) => select(page + 1, event)}
      >Next</a
    >
  {:else}
    <button
      type="button"
      class="cf-pagination__link"
      disabled={page >= lastPage}
      onclick={(event) => select(page + 1, event)}>Next</button
    >
  {/if}
</nav>
