<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { PostSummary } from "../types.js";

  interface Props extends Omit<HTMLAnchorAttributes, "href" | "title"> {
    result: PostSummary;
    query?: string;
    headingLevel?: 2 | 3 | 4;
  }

  let { result, query, headingLevel = 2, class: className, ...rest }: Props = $props();
  const dateTime = $derived(result.publishedAt ?? result.published);
  const dateLabel = $derived(result.published ?? result.publishedAt);
  const updatedDateTime = $derived(result.updatedAt ?? result.updated);
  const updatedDateLabel = $derived(result.updated ?? result.updatedAt);
  const description = $derived(result.excerpt ?? result.description);
  const HeadingElement = $derived(`h${headingLevel}` as "h2" | "h3" | "h4");

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

<a
  class={cx("cf-search-result-card", className)}
  href={result.href}
  aria-label={result.title}
  data-query={query || undefined}
  {...rest}
>
  {#if dateLabel || updatedDateLabel || result.readingTime}
    <p class="cf-search-result-card__meta">
      {#if dateLabel}<span>Published <time datetime={dateTime}>{dateLabel}</time></span
        >{/if}{#if dateLabel && (updatedDateLabel || result.readingTime)}<span
          class="cf-post-meta__separator"
          aria-hidden="true">·</span
        >{/if}{#if updatedDateLabel}<span
          >Updated <time datetime={updatedDateTime}>{updatedDateLabel}</time></span
        >{/if}{#if updatedDateLabel && result.readingTime}<span
          class="cf-post-meta__separator"
          aria-hidden="true">·</span
        >{/if}{result.readingTime}
    </p>
  {/if}
  <svelte:element this={HeadingElement} class="cf-search-result-card__title">
    {#each parts(result.title) as part}{#if part.match}<mark>{part.value}</mark
        >{:else}{part.value}{/if}{/each}
  </svelte:element>
  {#if description}
    <p class="cf-search-result-card__description">
      {#each parts(description) as part}{#if part.match}<mark>{part.value}</mark
          >{:else}{part.value}{/if}{/each}
    </p>
  {/if}
  {#if result.tags?.length}
    <div class="cf-search-result-card__tags" aria-label="Tags">
      {#each result.tags as tag (tag)}
        <span class="cf-tag">
          {#each parts(tag) as part}{#if part.match}<mark>{part.value}</mark>{:else}{part.value}{/if}{/each}
        </span>
      {/each}
    </div>
  {/if}
</a>
