<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import {
    createNavbarController,
    type NavbarCollapseAt,
    type NavbarController,
    type NavbarMenuVariant,
    type NavbarSurface,
  } from "@cofob/design-system-css";
  import { cx } from "../internal.js";
  import type { LinkItem } from "../types.js";

  interface Props extends Omit<HTMLAttributes<HTMLElement>, "children"> {
    brand?: string;
    brandLabel?: string;
    brandHref?: string;
    links?: readonly LinkItem[];
    open?: boolean;
    actions?: Snippet;
    brandContent?: Snippet;
    menuLabel?: string;
    menuToggleLabel?: string;
    collapseAt?: NavbarCollapseAt;
    menuVariant?: NavbarMenuVariant;
    surface?: NavbarSurface;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    brand = "cofob",
    brandLabel,
    brandHref = "/",
    links = [],
    open = $bindable(false),
    actions,
    brandContent,
    menuLabel = "Main navigation",
    menuToggleLabel = "Menu",
    collapseAt = "mobile",
    menuVariant = "floating",
    surface = "solid",
    onOpenChange,
    class: className,
    ...rest
  }: Props = $props();

  let root: HTMLElement;
  let controller: NavbarController | undefined;

  function handleOpenChange(next: boolean) {
    if (next === open) return;
    open = next;
    onOpenChange?.(next);
  }

  function handleToggle(event: Event) {
    handleOpenChange((event.currentTarget as HTMLDetailsElement).open);
  }

  onMount(() => {
    controller = createNavbarController(root, { initialOpen: open, onOpenChange: handleOpenChange });
    return () => controller?.destroy();
  });
</script>

<nav
  bind:this={root}
  class={cx("cf-navbar", className)}
  data-cf-navbar
  data-cf-navbar-managed="true"
  data-collapse-at={collapseAt}
  data-menu-variant={menuVariant}
  data-surface={surface}
  data-state={open ? "open" : "closed"}
  aria-label={menuLabel}
  {...rest}
>
  <a class="cf-navbar__brand" href={brandHref} aria-label={brandLabel ?? `${brand} home`}>
    {#if brandContent}{@render brandContent()}{:else}{brand}{/if}
  </a>
  <details class="cf-navbar__mobile" data-cf-navbar-disclosure {open} ontoggle={handleToggle}>
    <summary class="cf-navbar__menu-trigger" data-cf-navbar-trigger aria-expanded={open}>
      <span class="cf-navbar__menu-icon" aria-hidden="true"></span>
      <span class="cf-visually-hidden">{menuToggleLabel}</span>
    </summary>
  </details>
  <div class="cf-navbar__navigation" data-cf-navbar-panel>
    <ul class="cf-navbar__links">
      {#each links as link (link.href)}
        <li>
          <a
            class="cf-navbar__link"
            href={link.href}
            aria-current={link.current ? "page" : undefined}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
          >
            {link.label}
          </a>
        </li>
      {/each}
    </ul>
    {#if actions}<div class="cf-navbar__actions">{@render actions()}</div>{/if}
  </div>
</nav>
