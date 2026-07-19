import {
  addListener,
  createCleanup,
  createId,
  discoverControls,
  eventElement,
  normalizeElements,
  ownerDocument,
} from "./internal/dom.js";
import { createFloatingPositioner } from "./internal/floating.js";
import type { Controller } from "./types.js";

export type TooltipPlacement = "top" | "right" | "bottom" | "left";

export interface TooltipControllerOptions {
  triggers?: Element | Iterable<Element> | null;
  delay?: number;
  placement?: TooltipPlacement;
}

export interface TooltipController extends Controller {
  show(): void;
  hide(): void;
  isOpen(): boolean;
}

export function createTooltipController(
  tooltip: HTMLElement,
  options: TooltipControllerOptions = {},
): TooltipController {
  const element = tooltip;
  const cleanup = createCleanup();
  const triggers = options.triggers
    ? normalizeElements(options.triggers)
    : discoverControls(tooltip, "data-cf-tooltip-trigger");
  const document = ownerDocument(tooltip);
  const originalPlacement = tooltip.getAttribute("data-placement");
  if (options.placement || originalPlacement === null) tooltip.dataset.placement = options.placement ?? "top";
  // Tooltip placement is collision-aware and viewport-relative. Unlike Popover/Menu,
  // Tooltip does not author a CSS `position-area` contract, so opting into an anchor
  // merely because the browser supports it would leave a top-layer tooltip untethered.
  const positioner = createFloatingPositioner(tooltip, triggers[0] ?? null, {
    strategy: "fixed",
    alignment: "center",
  });
  let open = false;
  let pinned = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;
  const hovered = new Set<Element>();
  const focused = new Set<Element>();
  const originalDescriptions = new Map<Element, string | null>();
  const generatedId = !tooltip.id;

  if (generatedId) tooltip.id = createId("cf-tooltip");
  tooltip.setAttribute("role", "tooltip");
  tooltip.setAttribute("popover", "manual");

  const showNow = (trigger?: Element) => {
    clearTimeout(timer);
    if (trigger) positioner.setTrigger(trigger);
    if (destroyed || open) return;
    try {
      element.showPopover?.();
    } catch {
      /* CSS data-state fallback. */
    }
    open = true;
    tooltip.dataset.state = "open";
    positioner.update();
    queueMicrotask(() => positioner.update());
  };
  const show = (trigger?: Element) => {
    if (destroyed) return;
    if (trigger) positioner.setTrigger(trigger);
    clearTimeout(timer);
    const delay = options.delay ?? 1000;
    if (delay <= 0) showNow(trigger);
    else timer = setTimeout(() => showNow(trigger), delay);
  };
  const hide = () => {
    clearTimeout(timer);
    pinned = false;
    if (!open) return;
    try {
      element.hidePopover?.();
    } catch {
      /* CSS data-state fallback. */
    }
    open = false;
    tooltip.dataset.state = "closed";
  };
  const hideWhenInactive = () => {
    if (!pinned && hovered.size === 0 && focused.size === 0) hide();
  };

  for (const trigger of triggers) {
    originalDescriptions.set(trigger, trigger.getAttribute("aria-describedby"));
    const ids = new Set((trigger.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    ids.add(tooltip.id);
    trigger.setAttribute("aria-describedby", Array.from(ids).join(" "));
    cleanup.add(
      addListener(trigger, "mouseenter", () => {
        hovered.add(trigger);
        show(trigger);
      }),
    );
    cleanup.add(
      addListener(trigger, "mouseleave", () => {
        hovered.delete(trigger);
        hideWhenInactive();
      }),
    );
    cleanup.add(
      addListener(trigger, "focus", () => {
        focused.add(trigger);
        showNow(trigger);
      }),
    );
    cleanup.add(
      addListener(trigger, "blur", () => {
        focused.delete(trigger);
        hideWhenInactive();
      }),
    );
    cleanup.add(
      addListener(trigger, "keydown", (event) => {
        if ((event as KeyboardEvent).key === "Escape") hide();
      }),
    );
    cleanup.add(
      addListener(trigger, "click", () => {
        if (pinned && open) {
          hide();
          return;
        }
        pinned = true;
        showNow(trigger);
      }),
    );
  }

  cleanup.add(
    addListener(tooltip, "mouseenter", () => {
      hovered.add(tooltip);
    }),
  );
  cleanup.add(
    addListener(tooltip, "mouseleave", () => {
      hovered.delete(tooltip);
      hideWhenInactive();
    }),
  );
  cleanup.add(
    addListener(document, "pointerdown", (event) => {
      if (!pinned) return;
      const target = eventElement(event);
      if (target && !tooltip.contains(target) && !triggers.some((trigger) => trigger.contains(target)))
        hide();
    }),
  );
  cleanup.add(() => positioner.destroy());
  cleanup.add(() => {
    if (originalPlacement === null) tooltip.removeAttribute("data-placement");
    else tooltip.setAttribute("data-placement", originalPlacement);
  });

  tooltip.dataset.state = "closed";
  return {
    show,
    hide,
    isOpen: () => open,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearTimeout(timer);
      hide();
      cleanup.destroy();
      for (const [trigger, description] of originalDescriptions) {
        if (description === null) trigger.removeAttribute("aria-describedby");
        else trigger.setAttribute("aria-describedby", description);
      }
      if (generatedId) tooltip.removeAttribute("id");
    },
  };
}
