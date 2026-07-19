import {
  addListener,
  createCleanup,
  discoverControls,
  eventElement,
  focusElement,
  normalizeElements,
  ownerDocument,
  queryAll,
} from "./internal/dom.js";
import type { Controller } from "./types.js";
import { createFloatingPositioner } from "./internal/floating.js";

type PopoverPlacement = "top" | "right" | "bottom" | "left";

export interface PopoverControllerOptions {
  triggers?: Element | Iterable<Element> | null;
  /** Anchor used for positioning when state/event triggers are managed separately. */
  anchor?: Element | null;
  /** Preferred side of the active trigger. Collision fallback may flip it. */
  placement?: PopoverPlacement;
  initialOpen?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  returnFocus?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface PopoverController extends Controller {
  open(): void;
  close(): void;
  toggle(force?: boolean): void;
  isOpen(): boolean;
}

export function createPopoverController(
  popover: HTMLElement,
  options: PopoverControllerOptions = {},
): PopoverController {
  const element = popover;
  const cleanup = createCleanup();
  const document = ownerDocument(popover);
  const triggers = options.triggers
    ? normalizeElements(options.triggers)
    : discoverControls(popover, "data-cf-popover-trigger");
  const anchor = options.anchor ?? triggers[0] ?? null;
  const originalPlacement = popover.getAttribute("data-placement");
  if (options.placement) popover.dataset.placement = options.placement;
  const positioner = createFloatingPositioner(popover, anchor);
  cleanup.add(() => positioner.destroy());
  cleanup.add(() => {
    if (originalPlacement === null) popover.removeAttribute("data-placement");
    else popover.setAttribute("data-placement", originalPlacement);
  });
  let previousFocus: Element | null = null;
  let destroyed = false;
  let focusRestoreQueued = false;

  const disableNativeLightDismiss = options.closeOnEscape === false || options.closeOnOutsideClick === false;
  if (disableNativeLightDismiss) popover.setAttribute("popover", "manual");
  else if (!popover.hasAttribute("popover")) popover.setAttribute("popover", "auto");

  const isNativeOpen = () => {
    try {
      return popover.matches(":popover-open");
    } catch {
      return false;
    }
  };
  const nativeOpen = isNativeOpen();
  const authoredFallbackOpen = popover.getAttribute("data-cf-fallback-open") === "true";
  let fallbackMode = typeof element.showPopover !== "function" || (authoredFallbackOpen && !nativeOpen);
  let openState = nativeOpen || authoredFallbackOpen;

  const sync = (open: boolean, notify = true): boolean => {
    const changed = openState !== open;
    openState = open;
    popover.dataset.state = open ? "open" : "closed";
    if (open && fallbackMode) popover.setAttribute("data-cf-fallback-open", "true");
    else popover.removeAttribute("data-cf-fallback-open");
    for (const trigger of triggers) trigger.setAttribute("aria-expanded", String(open));
    if (changed && notify) options.onOpenChange?.(open);
    return changed;
  };
  const restoreFocus = () => {
    if (!(options.returnFocus ?? true) || focusRestoreQueued || !previousFocus) return;
    focusRestoreQueued = true;
    queueMicrotask(() => {
      focusRestoreQueued = false;
      focusElement(previousFocus);
    });
  };

  const open = () => {
    if (destroyed || openState) return;
    previousFocus = document.activeElement;
    try {
      if (!fallbackMode && typeof element.showPopover === "function") element.showPopover();
    } catch {
      fallbackMode = true;
    }
    sync(true);
    positioner.update();
    queueMicrotask(() => positioner.update());
  };

  const close = () => {
    if (destroyed || !openState) return;
    try {
      if (typeof element.hidePopover === "function") element.hidePopover();
    } catch {
      // Keep fallback state synchronized even if the native call rejects.
    }
    if (sync(false)) restoreFocus();
  };

  for (const trigger of triggers) {
    if (!trigger.hasAttribute("aria-controls") && popover.id)
      trigger.setAttribute("aria-controls", popover.id);
    cleanup.add(
      addListener(trigger, "click", () => {
        positioner.setTrigger(trigger);
        if (openState) close();
        else open();
      }),
    );
  }
  for (const closeButton of queryAll(popover, "[data-cf-popover-close]")) {
    cleanup.add(addListener(closeButton, "click", close));
  }

  cleanup.add(
    addListener(popover, "toggle", (event) => {
      const next = (event as Event & { newState?: string }).newState;
      if (next === "open" || next === "closed") {
        if (next === "open" && !openState) previousFocus = document.activeElement;
        const changed = sync(next === "open");
        if (next === "closed" && changed) restoreFocus();
      }
    }),
  );
  cleanup.add(
    addListener(document, "keydown", (event) => {
      if ((event as KeyboardEvent).key === "Escape" && (options.closeOnEscape ?? true)) close();
    }),
  );
  cleanup.add(
    addListener(document, "pointerdown", (event) => {
      if (!openState || !(options.closeOnOutsideClick ?? true)) return;
      const target = eventElement(event);
      if (
        target &&
        !popover.contains(target) &&
        !anchor?.contains(target) &&
        !triggers.some((trigger) => trigger.contains(target))
      )
        close();
    }),
  );

  sync(openState, false);
  if (openState) {
    positioner.update();
    queueMicrotask(() => positioner.update());
  }
  if (options.initialOpen && !openState) open();

  return {
    open,
    close,
    toggle(force) {
      const nextOpen = force ?? !openState;
      if (nextOpen) open();
      else close();
    },
    isOpen: () => openState,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cleanup.destroy();
    },
  };
}
