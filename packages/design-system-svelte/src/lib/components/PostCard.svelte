<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { PostSummary } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLElement>, "title"> {
    post: PostSummary;
  }

  let { post, class: className, ...rest }: Props = $props();
  const image = $derived(post.image ?? post.cover);
  const dateTime = $derived(post.publishedAt ?? post.published);
  const dateLabel = $derived(post.published ?? post.publishedAt);
  const description = $derived(post.excerpt ?? post.description);
</script>

<article class={cx("cf-post-card", className)} {...rest}>
  {#if image}
    <a class="cf-post-card__media" href={post.href} tabindex="-1" aria-hidden="true">
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
    </a>
  {/if}
  <div class="cf-post-card__content">
    {#if dateLabel || post.readingTime}
      <p class="cf-post-card__meta">
        {#if dateLabel}<span>Published <time datetime={dateTime}>{dateLabel}</time></span>{/if}
        {#if post.readingTime}<span>{post.readingTime}</span>{/if}
      </p>
    {/if}
    <h2 class="cf-post-card__title"><a href={post.href}>{post.title}</a></h2>
    {#if description}<p class="cf-post-card__excerpt">{description}</p>{/if}
    {#if post.tags?.length}
      <div class="cf-post-card__tags" aria-label="Tags">
        {#each post.tags as tag}<span class="cf-tag">{tag}</span>{/each}
      </div>
    {/if}
  </div>
</article>
