<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cx, runComposedEventHandlers } from "../internal.js";

  interface TriggerControls {
    open: () => void;
    expanded: boolean;
    controls: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLDialogElement>, "children" | "open" | "title"> {
    open?: boolean;
    defaultOpen?: boolean;
    title: string;
    description?: string;
    closeLabel?: string;
    side?: "left" | "right" | "top" | "bottom";
    trigger?: Snippet<[TriggerControls]>;
    children?: Snippet;
    footer?: Snippet;
    onOpenChange?: (open: boolean) => void;
  }

  type CloseEvent = Parameters<NonNullable<Props["onclose"]>>[0];
  type CancelEvent = Parameters<NonNullable<Props["oncancel"]>>[0];

  const generatedId = $props.id();
  let {
    defaultOpen = false,
    open = $bindable(defaultOpen),
    title,
    description,
    closeLabel = "Close drawer",
    side = "right",
    trigger,
    children,
    footer,
    onOpenChange,
    class: className,
    id,
    onclose,
    oncancel,
    ...rest
  }: Props = $props();

  const drawerId = $derived(id ?? `cf-drawer-${generatedId}`);
  const titleId = $derived(`${drawerId}-title`);
  const descriptionId = $derived(`${drawerId}-description`);
  let drawer: HTMLDialogElement;
  let returnFocus: HTMLElement | null = null;

  function setOpen(next: boolean) {
    if (open === next) return;
    open = next;
    onOpenChange?.(next);
  }

  function show() {
    if (typeof document !== "undefined") returnFocus = document.activeElement as HTMLElement | null;
    setOpen(true);
  }

  $effect(() => {
    if (!drawer) return;
    if (open && !drawer.open) drawer.showModal();
    if (!open && drawer.open) drawer.close();
  });

  function handleClose(event: CloseEvent) {
    runComposedEventHandlers(event, onclose, () => {
      setOpen(false);
      returnFocus?.focus();
    });
  }

  function handleCancel(event: CancelEvent) {
    runComposedEventHandlers(event, oncancel, () => setOpen(false), true);
  }
</script>

{#if trigger}{@render trigger({ open: show, expanded: open, controls: drawerId })}{/if}
<dialog
  bind:this={drawer}
  id={drawerId}
  class={cx("cf-drawer", className)}
  data-state={open ? "open" : "closed"}
  data-side={side}
  aria-labelledby={titleId}
  aria-describedby={description ? descriptionId : undefined}
  onclose={handleClose}
  oncancel={handleCancel}
  onclick={(event) => event.target === drawer && setOpen(false)}
  {...rest}
>
  <div class="cf-drawer__surface">
    <header class="cf-drawer__header">
      <div>
        <h2 id={titleId} class="cf-drawer__title">{title}</h2>
        {#if description}<p id={descriptionId} class="cf-drawer__description">{description}</p>{/if}
      </div>
      <button type="button" class="cf-drawer__close" aria-label={closeLabel} onclick={() => setOpen(false)}>
        <span aria-hidden="true">×</span>
      </button>
    </header>
    <div class="cf-drawer__body">{@render children?.()}</div>
    {#if footer}<footer class="cf-drawer__footer">{@render footer()}</footer>{/if}
  </div>
</dialog>
