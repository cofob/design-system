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
    title?: string;
    description?: string;
    closeLabel?: string;
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
    closeLabel = "Close dialog",
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

  const dialogId = $derived(id ?? `cf-dialog-${generatedId}`);
  const titleId = $derived(`${dialogId}-title`);
  const descriptionId = $derived(`${dialogId}-description`);
  let dialog: HTMLDialogElement;
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

  function close() {
    setOpen(false);
  }

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
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

  function handleBackdrop(event: MouseEvent) {
    if (event.target === dialog) close();
  }
</script>

{#if trigger}{@render trigger({ open: show, expanded: open, controls: dialogId })}{/if}
<dialog
  bind:this={dialog}
  id={dialogId}
  class={cx("cf-dialog", className)}
  data-state={open ? "open" : "closed"}
  aria-label={title ? undefined : "Dialog"}
  aria-labelledby={title ? titleId : undefined}
  aria-describedby={description ? descriptionId : undefined}
  onclose={handleClose}
  oncancel={handleCancel}
  onclick={handleBackdrop}
  {...rest}
>
  <div class="cf-dialog__surface">
    <header class="cf-dialog__header">
      <div>
        {#if title}<h2 id={titleId} class="cf-dialog__title">{title}</h2>{/if}
        {#if description}<p id={descriptionId} class="cf-dialog__description">{description}</p>{/if}
      </div>
      <button type="button" class="cf-dialog__close" aria-label={closeLabel} onclick={close}
        ><span aria-hidden="true">×</span></button
      >
    </header>
    <div class="cf-dialog__body">{@render children?.()}</div>
    {#if footer}<footer class="cf-dialog__footer">{@render footer()}</footer>{/if}
  </div>
</dialog>
