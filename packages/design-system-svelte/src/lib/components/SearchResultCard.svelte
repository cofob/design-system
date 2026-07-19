<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { PostSummary } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLElement>, "title"> {
    result: PostSummary;
    query?: string;
  }

  let { result, query, class: className, ...rest }: Props = $props();
  const dateTime = $derived(result.publishedAt ?? result.published);
  const dateLabel = $derived(result.published ?? result.publishedAt);
  const description = $derived(result.excerpt ?? result.description);

  function parts(value: string): Array<{ value: string; match: boolean }> {
    const normalizedQuery = query?.trim();
    if (!normalizedQuery) return [{ value, match: false }];
    const escaped = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return value
      .split(new RegExp(`(${escaped})`, "gi"))
      .filter(Boolean)
      .map((part) => ({
        value: part,
        match: part.toLowerCase() === normalizedQuery.toLowerCase(),
      }));
  }
</script>

<article class={cx("cf-search-result-card", className)} data-query={query || undefined} {...rest}>
  {#if dateLabel || result.readingTime}
    <p class="cf-search-result-card__meta">
      {#if dateLabel}<time datetime={dateTime}>{dateLabel}</time
        >{/if}{#if dateLabel && result.readingTime}<span class="cf-post-meta__separator" aria-hidden="true"
          >·</span
        >{/if}{result.readingTime}
    </p>
  {/if}
  <h2 class="cf-search-result-card__title">
    <a href={result.href}
      >{#each parts(result.title) as part}{#if part.match}<mark>{part.value}</mark
          >{:else}{part.value}{/if}{/each}</a
    >
  </h2>
  {#if description}
    <p class="cf-search-result-card__description">
      {#each parts(description) as part}{#if part.match}<mark>{part.value}</mark
          >{:else}{part.value}{/if}{/each}
    </p>
  {/if}
</article>
