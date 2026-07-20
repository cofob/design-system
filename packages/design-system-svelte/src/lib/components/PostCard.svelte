<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { PostSummary } from "../types.js";

  interface Props extends Omit<HTMLAnchorAttributes, "href" | "title"> {
    post: PostSummary;
    headingLevel?: 2 | 3 | 4;
  }

  let { post, headingLevel = 2, class: className, ...rest }: Props = $props();
  const image = $derived(post.image ?? post.cover);
  const dateTime = $derived(post.publishedAt ?? post.published);
  const dateLabel = $derived(post.published ?? post.publishedAt);
  const updatedDateTime = $derived(post.updatedAt ?? post.updated);
  const updatedDateLabel = $derived(post.updated ?? post.updatedAt);
  const description = $derived(post.excerpt ?? post.description);
  const HeadingElement = $derived(`h${headingLevel}` as "h2" | "h3" | "h4");
</script>

<a class={cx("cf-post-card", className)} href={post.href} aria-label={post.title} {...rest}>
  {#if image}
    <span class="cf-post-card__media" aria-hidden="true">
      <img
        class="cf-post-card__cover"
        src={image.src}
        alt=""
        width={image.width}
        height={image.height}
        srcset={image.srcSet ?? image.srcset}
        sizes={image.sizes}
        loading="lazy"
      />
    </span>
  {/if}
  <div class="cf-post-card__content">
    {#if dateLabel || updatedDateLabel || post.readingTime}
      <p class="cf-post-card__meta">
        {#if dateLabel}<span>Published <time datetime={dateTime}>{dateLabel}</time></span>{/if}
        {#if updatedDateLabel}<span>Updated <time datetime={updatedDateTime}>{updatedDateLabel}</time></span
          >{/if}
        {#if post.readingTime}<span>{post.readingTime}</span>{/if}
      </p>
    {/if}
    <svelte:element this={HeadingElement} class="cf-post-card__title">{post.title}</svelte:element>
    {#if description}<p class="cf-post-card__excerpt">{description}</p>{/if}
    {#if post.tags?.length}
      <div class="cf-post-card__tags" aria-label="Tags">
        {#each post.tags as tag}<span class="cf-tag">{tag}</span>{/each}
      </div>
    {/if}
  </div>
</a>
