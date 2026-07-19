import { createId, ownerDocument } from "./dom.js";

export type FloatingPlacement = "top" | "right" | "bottom" | "left";

interface StoredStyle {
  value: string;
  priority: string;
}

export interface FloatingPositioner {
  setTrigger(trigger: Element | null): void;
  update(): void;
  destroy(): void;
}

export interface FloatingPositionerOptions {
  /**
   * CSS anchors are preferred for surfaces with an authored position-area contract.
   * Use fixed when a surface needs the collision-aware viewport fallback regardless
   * of browser anchor support.
   */
  strategy?: "auto" | "fixed";
  /** Cross-axis alignment relative to the active trigger. */
  alignment?: "start" | "center";
}

const floatingProperties = [
  "position",
  "position-anchor",
  "inset",
  "top",
  "right",
  "bottom",
  "left",
] as const;

function storeStyle(element: HTMLElement, property: string): StoredStyle {
  return {
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  };
}

function restoreStyle(element: HTMLElement, property: string, stored: StoredStyle): void {
  if (stored.value) element.style.setProperty(property, stored.value, stored.priority);
  else element.style.removeProperty(property);
}

function isStylable(element: Element | null): element is HTMLElement {
  return Boolean(element && "style" in element && (element as HTMLElement).style);
}

function placementFrom(element: HTMLElement): FloatingPlacement {
  const placement = element.dataset.placement;
  return placement === "top" || placement === "right" || placement === "left" ? placement : "bottom";
}

function supportsAnchorPositioning(element: HTMLElement): boolean {
  const css = ownerDocument(element).defaultView?.CSS;
  return Boolean(
    css?.supports?.("position-anchor: --cf-overlay-anchor") && css.supports("position-area: bottom"),
  );
}

function candidatePosition(
  placement: FloatingPlacement,
  anchor: DOMRect,
  floating: Pick<DOMRect, "width" | "height">,
  offset: number,
  rtl: boolean,
  alignment: "start" | "center",
): { left: number; top: number } {
  const inlineStart =
    alignment === "center"
      ? anchor.left + (anchor.width - floating.width) / 2
      : rtl
        ? anchor.right - floating.width
        : anchor.left;
  const blockStart = alignment === "center" ? anchor.top + (anchor.height - floating.height) / 2 : anchor.top;
  switch (placement) {
    case "top":
      return { left: inlineStart, top: anchor.top - floating.height - offset };
    case "right":
      return { left: anchor.right + offset, top: blockStart };
    case "left":
      return { left: anchor.left - floating.width - offset, top: blockStart };
    default:
      return { left: inlineStart, top: anchor.bottom + offset };
  }
}

function overflowScore(
  position: { left: number; top: number },
  floating: Pick<DOMRect, "width" | "height">,
  viewportWidth: number,
  viewportHeight: number,
  padding: number,
): number {
  return (
    Math.max(0, padding - position.left) +
    Math.max(0, padding - position.top) +
    Math.max(0, position.left + floating.width + padding - viewportWidth) +
    Math.max(0, position.top + floating.height + padding - viewportHeight)
  );
}

function fallbackPlacements(preferred: FloatingPlacement): FloatingPlacement[] {
  const opposite: Record<FloatingPlacement, FloatingPlacement> = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  };
  const crossAxis: FloatingPlacement[] =
    preferred === "top" || preferred === "bottom" ? ["right", "left"] : ["bottom", "top"];
  return [preferred, opposite[preferred], ...crossAxis];
}

/**
 * Tethers a top-layer popover to its active trigger. CSS anchors are preferred;
 * older engines receive fixed viewport coordinates with flip and edge clamping.
 */
export function createFloatingPositioner(
  floating: HTMLElement,
  initialTrigger: Element | null,
  options: FloatingPositionerOptions = {},
): FloatingPositioner {
  const document = ownerDocument(floating);
  const window = document.defaultView;
  const anchorSupported = options.strategy !== "fixed" && supportsAnchorPositioning(floating);
  const anchorName = `--${createId("cf-overlay-anchor")}`;
  const storedFloatingStyles = new Map(
    floatingProperties.map((property) => [property, storeStyle(floating, property)]),
  );
  const originalPositioned = floating.getAttribute("data-cf-positioned");
  const originalResolvedPlacement = floating.getAttribute("data-cf-resolved-placement");
  let trigger: HTMLElement | null = null;
  let storedTriggerAnchor: StoredStyle | null = null;
  let destroyed = false;

  const restoreTrigger = () => {
    if (trigger && storedTriggerAnchor) restoreStyle(trigger, "anchor-name", storedTriggerAnchor);
    storedTriggerAnchor = null;
  };

  const setTrigger = (next: Element | null) => {
    const stylable = isStylable(next) ? next : null;
    if (stylable === trigger) return;
    restoreTrigger();
    trigger = stylable;
    if (trigger && anchorSupported) {
      storedTriggerAnchor = storeStyle(trigger, "anchor-name");
      trigger.style.setProperty("anchor-name", anchorName);
      floating.style.setProperty("position-anchor", anchorName);
      floating.dataset.cfPositioned = "anchor";
    }
  };

  const update = () => {
    if (destroyed || !trigger) return;
    const preferred = placementFrom(floating);
    if (anchorSupported) {
      floating.dataset.cfResolvedPlacement = preferred;
      return;
    }

    const anchorRect = trigger.getBoundingClientRect();
    const measuredRect = floating.getBoundingClientRect();
    // Entrance animations scale floating surfaces. Layout dimensions keep the
    // tether stable instead of baking the first animation frame into top/left.
    const floatingRect = {
      width: floating.offsetWidth || measuredRect.width,
      height: floating.offsetHeight || measuredRect.height,
    };
    const viewportWidth = document.documentElement.clientWidth || window?.innerWidth || 0;
    const viewportHeight = document.documentElement.clientHeight || window?.innerHeight || 0;
    const collisionPadding = 8;
    const offset = 8;
    const rtl = window?.getComputedStyle(trigger).direction === "rtl";
    const alignment = options.alignment ?? "start";
    const candidates = fallbackPlacements(preferred).map((placement) => ({
      placement,
      position: candidatePosition(placement, anchorRect, floatingRect, offset, rtl, alignment),
    }));
    const best = candidates.reduce((current, candidate) =>
      overflowScore(candidate.position, floatingRect, viewportWidth, viewportHeight, collisionPadding) <
      overflowScore(current.position, floatingRect, viewportWidth, viewportHeight, collisionPadding)
        ? candidate
        : current,
    );
    const maxLeft = Math.max(collisionPadding, viewportWidth - floatingRect.width - collisionPadding);
    const maxTop = Math.max(collisionPadding, viewportHeight - floatingRect.height - collisionPadding);
    const left = Math.min(Math.max(best.position.left, collisionPadding), maxLeft);
    const top = Math.min(Math.max(best.position.top, collisionPadding), maxTop);

    floating.dataset.cfPositioned = "fallback";
    floating.dataset.cfResolvedPlacement = best.placement;
    floating.style.setProperty("position", "fixed");
    floating.style.setProperty("inset", "auto");
    floating.style.setProperty("top", `${Math.round(top)}px`);
    floating.style.setProperty("left", `${Math.round(left)}px`);
  };

  setTrigger(initialTrigger);
  if (!anchorSupported) {
    window?.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
  }

  return {
    setTrigger(next) {
      setTrigger(next);
      update();
    },
    update,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      window?.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
      restoreTrigger();
      for (const [property, stored] of storedFloatingStyles) restoreStyle(floating, property, stored);
      if (originalPositioned === null) floating.removeAttribute("data-cf-positioned");
      else floating.setAttribute("data-cf-positioned", originalPositioned);
      if (originalResolvedPlacement === null) floating.removeAttribute("data-cf-resolved-placement");
      else floating.setAttribute("data-cf-resolved-placement", originalResolvedPlacement);
    },
  };
}
