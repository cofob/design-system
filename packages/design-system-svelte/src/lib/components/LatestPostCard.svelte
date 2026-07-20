<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { PostSummary } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLElement>, "title"> {
    post: PostSummary;
    eyebrow?: string;
    headingLevel?: 2 | 3 | 4;
  }

  let { post, eyebrow = "Latest post", headingLevel = 2, class: className, ...rest }: Props = $props();
  const image = $derived(post.image ?? post.cover);
  const dateTime = $derived(post.publishedAt ?? post.published);
  const dateLabel = $derived(post.published ?? post.publishedAt);
  const updatedDateTime = $derived(post.updatedAt ?? post.updated);
  const updatedDateLabel = $derived(post.updated ?? post.updatedAt);
  const description = $derived(post.excerpt ?? post.description);
  const HeadingElement = $derived(`h${headingLevel}` as "h2" | "h3" | "h4");
</script>

<article class={cx("cf-latest-post-card", className)} {...rest}>
  <div class="cf-latest-post-card__content">
    <p class="cf-latest-post-card__eyebrow">{eyebrow}</p>
    <svelte:element this={HeadingElement} class="cf-latest-post-card__title"
      ><a href={post.href}>{post.title}</a></svelte:element
    >
    {#if description}<p class="cf-latest-post-card__description">{description}</p>{/if}
    {#if dateLabel || updatedDateLabel || post.readingTime}<p class="cf-latest-post-card__meta">
        {#if dateLabel}<span>Published <time datetime={dateTime}>{dateLabel}</time></span
          >{/if}{#if dateLabel && (updatedDateLabel || post.readingTime)}<span
            class="cf-post-meta__separator"
            aria-hidden="true">·</span
          >{/if}{#if updatedDateLabel}<span
            >Updated <time datetime={updatedDateTime}>{updatedDateLabel}</time></span
          >{/if}{#if updatedDateLabel && post.readingTime}<span
            class="cf-post-meta__separator"
            aria-hidden="true">·</span
          >{/if}{post.readingTime}
      </p>{/if}
    <a class="cf-link" href={post.href}>Read article <span aria-hidden="true">→</span></a>
  </div>
  {#if image}
    <img
      class="cf-latest-post-card__image"
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      srcset={image.srcSet ?? image.srcset}
      sizes={image.sizes}
      loading="eager"
    />
  {/if}
</article>
