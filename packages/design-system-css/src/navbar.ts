import { addListener, createCleanup, eventElement, focusElement, ownerDocument } from "./internal/dom.js";
import type { Controller } from "./types.js";

export type NavbarCollapseAt = "mobile" | "tablet" | "never";
export type NavbarMenuVariant = "floating" | "flush";
export type NavbarSurface = "solid" | "translucent";

export interface NavbarControllerOptions {
  initialOpen?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnNavigate?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface NavbarController extends Controller {
  open(): void;
  close(options?: { returnFocus?: boolean }): void;
  toggle(force?: boolean): void;
  isOpen(): boolean;
}

export function createNavbarController(
  navbar: HTMLElement,
  options: NavbarControllerOptions = {},
): NavbarController {
  const cleanup = createCleanup();
  const document = ownerDocument(navbar);
  const disclosure = navbar.querySelector<HTMLDetailsElement>(
    "[data-cf-navbar-disclosure], details.cf-navbar__mobile",
  );
  const trigger = navbar.querySelector<HTMLElement>("[data-cf-navbar-trigger], .cf-navbar__menu-trigger");
  const panel = navbar.querySelector<HTMLElement>("[data-cf-navbar-panel], .cf-navbar__navigation");
  const originalOpen = disclosure?.open ?? false;
  const originalState = navbar.getAttribute("data-state");
  const originalExpanded = trigger?.getAttribute("aria-expanded") ?? null;
  let openState = options.initialOpen ?? disclosure?.open ?? navbar.dataset.state === "open";
  let destroyed = false;
  const isOpen = () => disclosure?.open ?? openState;

  const sync = (open: boolean, notify = true) => {
    if (destroyed) return false;
    const changed = openState !== open || (disclosure ? disclosure.open !== open : false);
    openState = open;
    navbar.dataset.state = open ? "open" : "closed";
    if (disclosure && disclosure.open !== open) disclosure.open = open;
    trigger?.setAttribute("aria-expanded", String(open));
    if (changed && notify) options.onOpenChange?.(open);
    return changed;
  };
  const open = () => sync(true);
  const close = (closeOptions: { returnFocus?: boolean } = {}) => {
    const changed = sync(false);
    if (changed && closeOptions.returnFocus) focusElement(trigger);
  };

  if (disclosure) {
    cleanup.add(
      addListener(disclosure, "toggle", () => {
        sync(disclosure.open);
      }),
    );
    if (trigger) {
      cleanup.add(
        addListener(trigger, "click", () => {
          setTimeout(() => sync(disclosure.open), 0);
        }),
      );
    }
  } else if (trigger) {
    cleanup.add(
      addListener(trigger, "click", () => {
        sync(!openState);
      }),
    );
  }

  cleanup.add(
    addListener(document, "keydown", (event) => {
      if (!isOpen() || !(options.closeOnEscape ?? true) || (event as KeyboardEvent).key !== "Escape") return;
      event.preventDefault();
      close({ returnFocus: true });
    }),
  );
  cleanup.add(
    addListener(document, "pointerdown", (event) => {
      if (!isOpen() || !(options.closeOnOutsideClick ?? true)) return;
      const target = eventElement(event);
      if (target && !navbar.contains(target)) close();
    }),
  );
  cleanup.add(
    addListener(navbar, "click", (event) => {
      if (!isOpen() || !(options.closeOnNavigate ?? true)) return;
      const target = eventElement(event);
      if (target?.closest("a[href]") && panel?.contains(target)) close();
    }),
  );

  const collapseAt = (navbar.dataset.collapseAt as NavbarCollapseAt | undefined) ?? "mobile";
  const desktopQuery =
    collapseAt === "tablet"
      ? "(min-width: 64.0625rem)"
      : collapseAt === "mobile"
        ? "(min-width: 48rem)"
        : null;
  const desktop = desktopQuery ? document.defaultView?.matchMedia?.(desktopQuery) : null;
  if (desktop) {
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) sync(false);
    };
    cleanup.add(addListener(desktop, "change", onBreakpointChange as EventListener));
    if (desktop.matches) sync(false, false);
  }

  sync(openState, false);

  return {
    open,
    close,
    toggle(force) {
      sync(force ?? !isOpen());
    },
    isOpen,
    destroy() {
      if (destroyed) return;
      cleanup.destroy();
      if (disclosure) disclosure.open = originalOpen;
      if (originalState === null) navbar.removeAttribute("data-state");
      else navbar.setAttribute("data-state", originalState);
      if (trigger) {
        if (originalExpanded === null) trigger.removeAttribute("aria-expanded");
        else trigger.setAttribute("aria-expanded", originalExpanded);
      }
      destroyed = true;
    },
  };
}
