import type { DesignSystemRoot } from "../types.js";

let idCounter = 0;

export function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function ownerDocument(node: Node): Document {
  return node.nodeType === 9 ? (node as Document) : (node.ownerDocument ?? (node as Document));
}

export function defaultRoot(): DesignSystemRoot | null {
  return typeof document === "undefined" ? null : document;
}

export function queryAll<T extends Element>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

export function normalizeElements(value: Element | Iterable<Element> | null | undefined): Element[] {
  if (!value) return [];
  if (typeof (value as Iterable<Element>)[Symbol.iterator] === "function") {
    return Array.from(value as Iterable<Element>);
  }
  return [value as Element];
}

export function discoverControls(element: Element, attribute: string): Element[] {
  const document = ownerDocument(element);
  const id = element.id;
  if (!id) return [];

  return queryAll(document, `[aria-controls], [${attribute}]`).filter(
    (candidate) => candidate.getAttribute("aria-controls") === id || candidate.getAttribute(attribute) === id,
  );
}

export function addListener(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions | boolean,
): () => void {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
}

export function createCleanup(): {
  add(cleanup: () => void): void;
  destroy(): void;
} {
  const cleanups = new Set<() => void>();
  return {
    add(cleanup) {
      cleanups.add(cleanup);
    },
    destroy() {
      for (const cleanup of Array.from(cleanups).reverse()) cleanup();
      cleanups.clear();
    },
  };
}

export function isDisabled(element: Element): boolean {
  return (
    element.getAttribute("aria-disabled") === "true" ||
    ("disabled" in element && Boolean((element as HTMLButtonElement).disabled))
  );
}

export function focusElement(element: Element | null | undefined): void {
  if (element && "focus" in element && typeof (element as HTMLElement).focus === "function") {
    (element as HTMLElement).focus();
  }
}

export function firstFocusable(root: ParentNode): HTMLElement | null {
  const selector = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  return root.querySelector<HTMLElement>(selector);
}

export function eventElement(event: Event): Element | null {
  const target = event.target;
  return target && (target as Node).nodeType === 1 ? (target as Element) : null;
}
