import {
  addListener,
  createCleanup,
  discoverControls,
  focusElement,
  isDisabled,
  normalizeElements,
  queryAll,
} from "./internal/dom.js";
import { createPopoverController } from "./popover.js";
import type { Controller } from "./types.js";

export interface MenuControllerOptions {
  trigger?: Element | null;
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface MenuController extends Controller {
  open(focus?: "first" | "last" | false): void;
  close(): void;
  toggle(force?: boolean): void;
  isOpen(): boolean;
}

export function createMenuController(menu: HTMLElement, options: MenuControllerOptions = {}): MenuController {
  const cleanup = createCleanup();
  const discovered = discoverControls(menu, "data-cf-menu-trigger");
  const trigger = options.trigger ?? discovered[0] ?? null;
  const triggers = trigger ? normalizeElements(trigger) : discovered;
  const popover = createPopoverController(menu, {
    triggers,
    ...(options.initialOpen === undefined ? {} : { initialOpen: options.initialOpen }),
    ...(options.onOpenChange === undefined ? {} : { onOpenChange: options.onOpenChange }),
  });
  let typeahead = "";
  let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;
  const originalTabIndices = new Map<HTMLElement, string | null>();
  let activeItem: HTMLElement | null = null;

  const allItems = () =>
    queryAll<HTMLElement>(
      menu,
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], .cf-menu__item',
    );
  const items = () => allItems().filter((item) => !isDisabled(item) && !item.hidden);

  const rememberTabIndex = (item: HTMLElement) => {
    if (!originalTabIndices.has(item)) originalTabIndices.set(item, item.getAttribute("tabindex"));
  };
  const setActiveItem = (item: HTMLElement | null) => {
    const currentItems = allItems();
    for (const candidate of currentItems) {
      rememberTabIndex(candidate);
      candidate.tabIndex = candidate === item && !isDisabled(candidate) && !candidate.hidden ? 0 : -1;
    }
    activeItem = item;
  };
  const syncTabStops = () => {
    const currentItems = items();
    const preferred =
      (activeItem && currentItems.includes(activeItem) ? activeItem : null) ??
      currentItems.find((item) => item.getAttribute("tabindex") === "0") ??
      currentItems[0] ??
      null;
    setActiveItem(preferred);
  };

  const focusAt = (index: number) => {
    const currentItems = items();
    if (currentItems.length === 0) return;
    const normalized = ((index % currentItems.length) + currentItems.length) % currentItems.length;
    const item = currentItems[normalized] ?? null;
    setActiveItem(item);
    focusElement(item);
  };

  const focusRelative = (offset: number) => {
    const currentItems = items();
    const activeIndex = currentItems.indexOf(menu.ownerDocument.activeElement as HTMLElement);
    focusAt((activeIndex < 0 ? (offset > 0 ? -1 : 0) : activeIndex) + offset);
  };

  const open = (focus: "first" | "last" | false = "first") => {
    popover.open();
    if (focus !== false) queueMicrotask(() => focusAt(focus === "first" ? 0 : -1));
  };
  const close = () => popover.close();

  cleanup.add(
    addListener(menu, "keydown", (event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "ArrowDown") {
        keyboardEvent.preventDefault();
        focusRelative(1);
      } else if (keyboardEvent.key === "ArrowUp") {
        keyboardEvent.preventDefault();
        focusRelative(-1);
      } else if (keyboardEvent.key === "Home") {
        keyboardEvent.preventDefault();
        focusAt(0);
      } else if (keyboardEvent.key === "End") {
        keyboardEvent.preventDefault();
        focusAt(-1);
      } else if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        close();
      } else if (
        keyboardEvent.key.length === 1 &&
        !keyboardEvent.altKey &&
        !keyboardEvent.ctrlKey &&
        !keyboardEvent.metaKey
      ) {
        typeahead += keyboardEvent.key.toLocaleLowerCase();
        clearTimeout(typeaheadTimer);
        typeaheadTimer = setTimeout(() => {
          typeahead = "";
        }, 500);
        const match = items().find((item) =>
          item.textContent?.trim().toLocaleLowerCase().startsWith(typeahead),
        );
        if (match) {
          setActiveItem(match);
          focusElement(match);
        }
      }
    }),
  );

  cleanup.add(
    addListener(menu, "focusin", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !items().includes(target)) return;
      setActiveItem(target);
    }),
  );

  cleanup.add(
    addListener(menu, "click", (event) => {
      const target = event.target as Element | null;
      const item = target?.closest(
        '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], .cf-menu__item',
      );
      if (item instanceof HTMLElement && !isDisabled(item)) {
        setActiveItem(item);
        if (item.getAttribute("data-cf-menu-keep-open") !== "true") close();
      }
    }),
  );

  if (trigger) {
    if (!trigger.hasAttribute("aria-haspopup")) trigger.setAttribute("aria-haspopup", "menu");
    cleanup.add(
      addListener(trigger, "click", () => {
        if (popover.isOpen()) queueMicrotask(() => focusAt(0));
      }),
    );
    cleanup.add(
      addListener(trigger, "keydown", (event) => {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.key === "ArrowDown") {
          keyboardEvent.preventDefault();
          open("first");
        } else if (keyboardEvent.key === "ArrowUp") {
          keyboardEvent.preventDefault();
          open("last");
        }
      }),
    );
  }

  syncTabStops();

  return {
    open,
    close,
    toggle(force) {
      if (force ?? !popover.isOpen()) open(false);
      else close();
    },
    isOpen: popover.isOpen,
    destroy() {
      clearTimeout(typeaheadTimer);
      cleanup.destroy();
      popover.destroy();
      for (const [item, tabIndex] of originalTabIndices) {
        if (tabIndex === null) item.removeAttribute("tabindex");
        else item.setAttribute("tabindex", tabIndex);
      }
    },
  };
}
