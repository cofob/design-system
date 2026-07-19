<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx } from "../internal.js";
  import type { FooterGroup, LinkItem } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLElement>, "children"> {
    brand?: string;
    description?: string;
    groups?: readonly FooterGroup[];
    links?: readonly LinkItem[];
    copyright?: string;
    children?: Snippet;
  }

  let {
    brand = "cofob",
    description,
    groups = [],
    links = [],
    copyright = `© ${new Date().getFullYear()} ${brand}`,
    children,
    class: className,
    ...rest
  }: Props = $props();
</script>

<footer class={cx("cf-footer", className)} {...rest}>
  <div class="cf-footer__main">
    <div class="cf-footer__brand">
      <strong>{brand}</strong>
      {#if description}<p>{description}</p>{/if}
      {@render children?.()}
    </div>
    {#each groups as group (group.title)}
      <nav class="cf-footer__group" aria-label={group.title}>
        <h2>{group.title}</h2>
        <ul>
          {#each group.links as link (link.href)}
            <li>
              <a
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}>{link.label}</a
              >
            </li>
          {/each}
        </ul>
      </nav>
    {/each}
  </div>
  <div class="cf-footer__meta">
    <p>{copyright}</p>
    {#if links.length}
      <nav aria-label="Footer links">
        {#each links as link (link.href)}<a href={link.href}>{link.label}</a>{/each}
      </nav>
    {/if}
  </div>
</footer>
