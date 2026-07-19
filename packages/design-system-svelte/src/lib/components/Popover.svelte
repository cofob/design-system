<script lang="ts">
  import { createPopoverController } from "@cofob/design-system-css";
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx, runComposedEventHandlers } from "../internal.js";

  interface TriggerControls {
    open: () => void;
    expanded: boolean;
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
    open?: boolean;
    defaultOpen?: boolean;
    label?: string;
    placement?: "top" | "right" | "bottom" | "left";
    trigger?: Snippet<[TriggerControls]>;
    children?: Snippet;
    onOpenChange?: (open: boolean) => void;
  }

  type ToggleEvent = Parameters<NonNullable<Props["ontoggle"]>>[0];

  let {
    defaultOpen = false,
    open = $bindable(defaultOpen),
    label = "Open popover",
    placement = "bottom",
    trigger,
    children,
    onOpenChange,
    class: className,
    popover: popoverMode = "manual",
    ontoggle,
    ...rest
  }: Props = $props();

  let surface: HTMLDivElement;
  let anchor: HTMLDivElement;
  let nativePopover = $state(true);

  onMount(() => {
    nativePopover = "showPopover" in HTMLElement.prototype;
  });

  function setOpen(next: boolean) {
    if (open === next) return;
    open = next;
    onOpenChange?.(next);
  }

  function show() {
    if (nativePopover && surface) surface.showPopover();
    else setOpen(true);
  }

  function toggle() {
    if (nativePopover && surface) surface.togglePopover();
    else setOpen(!open);
  }

  $effect(() => {
    if (!surface || !nativePopover) return;
    if (open && !surface.matches(":popover-open")) surface.showPopover();
    if (!open && surface.matches(":popover-open")) surface.hidePopover();
  });

  $effect(() => {
    if (!open || !surface || !anchor) return;
    const controller = createPopoverController(surface, { triggers: [], anchor, placement });
    return () => controller.destroy();
  });

  function handleToggle(event: ToggleEvent) {
    runComposedEventHandlers(event, ontoggle, (currentEvent) => {
      const next = (currentEvent as Event & { newState: string }).newState === "open";
      setOpen(next);
    });
  }
</script>

<div class="cf-popover-root">
  <div bind:this={anchor} class="cf-popover__anchor">
    {#if trigger}
      {@render trigger({ open: show, expanded: open })}
    {:else}
      <button type="button" class="cf-button" data-variant="secondary" aria-expanded={open} onclick={toggle}
        >{label}</button
      >
    {/if}
  </div>
  <div
    bind:this={surface}
    class={cx("cf-popover", className)}
    popover={popoverMode}
    data-state={open ? "open" : "closed"}
    data-cf-fallback-open={!nativePopover && open ? "true" : undefined}
    data-cf-positioned="anchor"
    data-placement={placement}
    hidden={!nativePopover && !open}
    ontoggle={handleToggle}
    {...rest}
  >
    {@render children?.()}
  </div>
</div>
