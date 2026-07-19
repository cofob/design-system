import {
  addListener,
  createCleanup,
  discoverControls,
  eventElement,
  firstFocusable,
  focusElement,
  normalizeElements,
  ownerDocument,
  queryAll,
} from "./internal/dom.js";
import type { Controller } from "./types.js";

export interface DialogControllerOptions {
  triggers?: Element | Iterable<Element> | null;
  closeOnBackdrop?: boolean;
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface DialogController extends Controller {
  open(): void;
  close(returnValue?: string): void;
  toggle(force?: boolean): void;
  isOpen(): boolean;
}

export function createDialogController(
  dialog: HTMLDialogElement,
  options: DialogControllerOptions = {},
): DialogController {
  const cleanup = createCleanup();
  const document = ownerDocument(dialog);
  const triggers = options.triggers
    ? normalizeElements(options.triggers)
    : discoverControls(dialog, "data-cf-dialog-trigger");
  let previousFocus: Element | null = null;
  let destroyed = false;
  let focusRestoreQueued = false;

  const isOpen = () => dialog.open || dialog.hasAttribute("open");
  let openState = isOpen();
  const sync = (open: boolean, notify = true): boolean => {
    const changed = openState !== open;
    openState = open;
    dialog.dataset.state = open ? "open" : "closed";
    for (const trigger of triggers) trigger.setAttribute("aria-expanded", String(open));
    if (changed && notify) options.onOpenChange?.(open);
    return changed;
  };
  const restoreFocus = () => {
    if (focusRestoreQueued || !previousFocus) return;
    focusRestoreQueued = true;
    queueMicrotask(() => {
      focusRestoreQueued = false;
      focusElement(previousFocus);
    });
  };

  const open = () => {
    if (destroyed || isOpen()) return;
    previousFocus = document.activeElement;
    try {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } catch {
      dialog.setAttribute("open", "");
    }
    sync(true);
    queueMicrotask(() => {
      if (!destroyed && isOpen()) focusElement(firstFocusable(dialog) ?? dialog);
    });
  };

  const close = (returnValue = "") => {
    if (destroyed || !isOpen()) return;
    try {
      if (typeof dialog.close === "function") dialog.close(returnValue);
      else dialog.removeAttribute("open");
    } catch {
      dialog.removeAttribute("open");
    }
    if (sync(false)) restoreFocus();
  };

  for (const trigger of triggers) {
    if (!trigger.hasAttribute("aria-controls") && dialog.id) trigger.setAttribute("aria-controls", dialog.id);
    cleanup.add(addListener(trigger, "click", () => open()));
  }

  for (const closeButton of queryAll(dialog, "[data-cf-dialog-close]")) {
    cleanup.add(
      addListener(closeButton, "click", () => close(closeButton.getAttribute("data-cf-dialog-close") ?? "")),
    );
  }

  cleanup.add(
    addListener(dialog, "click", (event) => {
      if ((options.closeOnBackdrop ?? true) && event.target === dialog) close();
    }),
  );
  cleanup.add(
    addListener(dialog, "close", () => {
      if (sync(false)) restoreFocus();
    }),
  );
  cleanup.add(
    addListener(dialog, "keydown", (event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape" && isOpen()) close();
    }),
  );
  cleanup.add(
    addListener(document, "click", (event) => {
      const target = eventElement(event);
      if (target?.closest("[data-cf-dialog-close]") && dialog.contains(target)) close();
    }),
  );

  sync(isOpen(), false);
  if (options.initialOpen && !isOpen()) open();

  return {
    open,
    close,
    toggle(force) {
      const nextOpen = force ?? !isOpen();
      if (nextOpen) open();
      else close();
    },
    isOpen,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cleanup.destroy();
    },
  };
}
