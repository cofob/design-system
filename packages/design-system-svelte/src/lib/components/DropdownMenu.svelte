<script lang="ts">
  import { createPopoverController } from "@cofob/design-system-css";
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx, runComposedEventHandlers } from "../internal.js";
  import type { MenuItem } from "../types.js";

  interface TriggerControls {
    open: (focus?: "first" | "last") => void;
    toggle: () => void;
    expanded: boolean;
    controls: string;
    id: string;
    onkeydown: (event: KeyboardEvent) => void;
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    open?: boolean;
    defaultOpen?: boolean;
    label?: string;
    placement?: "top" | "right" | "bottom" | "left";
    items: MenuItem[];
    trigger?: Snippet<[TriggerControls]>;
    onSelect?: (item: MenuItem) => void;
    onOpenChange?: (open: boolean) => void;
  }

  type MenuToggleEvent = Parameters<NonNullable<Props["ontoggle"]>>[0];
  type MenuKeyboardEvent = Parameters<NonNullable<Props["onkeydown"]>>[0];

  const generatedId = $props.id();

  let {
    defaultOpen = false,
    open = $bindable(defaultOpen),
    label = "Open menu",
    placement = "bottom",
    items,
    trigger,
    onSelect,
    onOpenChange,
    class: className,
    id,
    popover: popoverMode = "manual",
    ontoggle,
    onkeydown,
    ...rest
  }: Props = $props();

  const menuId = $derived(id ?? `cf-menu-${generatedId}`);
  const triggerId = $derived(`${menuId}-trigger`);
  let menu: HTMLDivElement;
  let anchor: HTMLDivElement;
  let nativePopover = $state(true);
  let activeId = $state<string>();
  const rovingId = $derived(
    items.some((item) => !item.disabled && item.id === activeId)
      ? activeId
      : (items.find((item) => !item.disabled)?.id ?? ""),
  );
  let returnFocus: HTMLElement | null = null;
  let restoreFocusOnClose = false;
  let typeahead = "";
  let typeaheadTimer: ReturnType<typeof setTimeout>;

  onMount(() => {
    nativePopover = "showPopover" in HTMLElement.prototype;
    return () => clearTimeout(typeaheadTimer);
  });

  function setOpen(next: boolean) {
    if (open === next) return;
    open = next;
    onOpenChange?.(next);
  }

  function show(focus: "first" | "last" = "first") {
    if (typeof document !== "undefined") returnFocus = document.activeElement as HTMLElement | null;
    if (nativePopover) {
      if (menu && !menu.matches(":popover-open")) menu.showPopover();
    } else {
      setOpen(true);
    }
    queueMicrotask(() => focusItem(focus === "first" ? 0 : -1));
  }

  function restoreTriggerFocus() {
    queueMicrotask(() => returnFocus?.focus());
  }

  function hide(restoreFocus = true) {
    restoreFocusOnClose = restoreFocus;
    if (nativePopover && menu?.matches(":popover-open")) {
      menu.hidePopover();
    } else {
      setOpen(false);
      if (restoreFocusOnClose) restoreTriggerFocus();
      restoreFocusOnClose = false;
    }
  }

  function toggle() {
    if (open || (nativePopover && menu?.matches(":popover-open"))) hide();
    else show();
  }

  $effect(() => {
    if (!menu || !nativePopover) return;
    if (open && !menu.matches(":popover-open")) menu.showPopover();
    if (!open && menu.matches(":popover-open")) {
      restoreFocusOnClose = true;
      menu.hidePopover();
    }
  });

  $effect(() => {
    if (!open || !menu || !anchor) return;
    const controller = createPopoverController(menu, { triggers: [], anchor, placement });
    return () => controller.destroy();
  });

  function menuItems(): HTMLElement[] {
    return menu
      ? [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')]
      : [];
  }

  function focusItem(index: number) {
    const candidates = menuItems();
    if (!candidates.length) return;
    const item = candidates[(index + candidates.length) % candidates.length];
    if (!item) return;
    activeId = item.dataset.menuItemId ?? "";
    item.focus();
  }

  function handleTriggerKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      show("first");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      show("last");
    }
  }

  function handleInternalKeydown(event: KeyboardEvent) {
    const candidates = menuItems();
    const current = candidates.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(current < 0 ? 0 : current + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(current < 0 ? -1 : current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(candidates.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      hide(true);
    } else if (event.key === "Tab") {
      hide(false);
    } else if (event.key.length === 1 && /\S/.test(event.key)) {
      event.preventDefault();
      typeahead += event.key.toLowerCase();
      clearTimeout(typeaheadTimer);
      typeaheadTimer = setTimeout(() => (typeahead = ""), 500);
      const match = candidates.find((item) => item.textContent?.trim().toLowerCase().startsWith(typeahead));
      if (match) {
        activeId = match.dataset.menuItemId ?? "";
        match.focus();
      }
    }
  }

  function handleKeydown(event: MenuKeyboardEvent) {
    runComposedEventHandlers(event, onkeydown, handleInternalKeydown, true);
  }

  function select(item: MenuItem, event: MouseEvent) {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    activeId = item.id;
    onSelect?.(item);
    hide(true);
  }

  function handleToggle(event: MenuToggleEvent) {
    runComposedEventHandlers(event, ontoggle, (currentEvent) => {
      const next = (currentEvent as Event & { newState?: string }).newState === "open";
      setOpen(next);
      if (!next && restoreFocusOnClose) restoreTriggerFocus();
      if (!next) restoreFocusOnClose = false;
    });
  }
</script>

<div class="cf-dropdown-menu-root">
  <div bind:this={anchor} class="cf-dropdown-menu__anchor">
    {#if trigger}
      {@render trigger({
        open: show,
        toggle,
        expanded: open,
        controls: menuId,
        id: triggerId,
        onkeydown: handleTriggerKeydown,
      })}
    {:else}
      <button
        id={triggerId}
        type="button"
        class="cf-button"
        data-variant="secondary"
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={open}
        onclick={toggle}
        onkeydown={handleTriggerKeydown}>{label}</button
      >
    {/if}
  </div>
  <div
    bind:this={menu}
    id={menuId}
    class={cx("cf-menu", "cf-dropdown-menu", className)}
    popover={popoverMode}
    role="menu"
    aria-label={label}
    data-state={open ? "open" : "closed"}
    data-cf-fallback-open={!nativePopover && open ? "true" : undefined}
    data-cf-positioned="anchor"
    data-placement={placement}
    hidden={!nativePopover && !open}
    ontoggle={handleToggle}
    onkeydown={handleKeydown}
    {...rest}
  >
    {#each items as item (item.id)}
      {#if item.href}
        <a
          class="cf-menu__item cf-dropdown-menu__item"
          data-menu-item-id={item.id}
          data-tone={item.destructive ? "danger" : undefined}
          href={item.disabled ? undefined : item.href}
          role="menuitem"
          tabindex={!item.disabled && item.id === rovingId ? 0 : -1}
          aria-disabled={item.disabled || undefined}
          onfocus={() => (activeId = item.id)}
          onclick={(event) => select(item, event)}>{item.label}</a
        >
      {:else}
        <button
          type="button"
          class="cf-menu__item cf-dropdown-menu__item"
          data-menu-item-id={item.id}
          data-tone={item.destructive ? "danger" : undefined}
          role="menuitem"
          tabindex={!item.disabled && item.id === rovingId ? 0 : -1}
          disabled={item.disabled}
          aria-disabled={item.disabled || undefined}
          onfocus={() => (activeId = item.id)}
          onclick={(event) => select(item, event)}>{item.label}</button
        >
      {/if}
    {/each}
  </div>
</div>
