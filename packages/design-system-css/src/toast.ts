import { addListener, createCleanup, createId, ownerDocument } from "./internal/dom.js";
import type { Controller, ToastInput } from "./types.js";

export interface ToastController extends Controller {
  toast(input: ToastInput): string;
  dismiss(id: string): void;
  clear(): void;
}

const TOAST_EXIT_FALLBACK_MS = 250;

export function createToastController(viewport: HTMLElement): ToastController {
  const document = ownerDocument(viewport);
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const removalTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const toastCleanups = new Map<string, ReturnType<typeof createCleanup>>();
  let destroyed = false;

  viewport.classList.add("cf-toast-viewport");
  viewport.setAttribute("role", "region");
  viewport.setAttribute("aria-label", viewport.getAttribute("aria-label") ?? "Notifications");
  viewport.setAttribute("aria-live", viewport.getAttribute("aria-live") ?? "polite");

  const findToast = (id: string) =>
    Array.from(viewport.querySelectorAll<HTMLElement>("[data-cf-toast-id]")).find(
      (candidate) => candidate.dataset.cfToastId === id,
    );

  const finishDismissal = (id: string) => {
    const timer = timers.get(id);
    if (timer) clearTimeout(timer);
    timers.delete(id);
    const removalTimer = removalTimers.get(id);
    if (removalTimer) clearTimeout(removalTimer);
    removalTimers.delete(id);
    toastCleanups.get(id)?.destroy();
    toastCleanups.delete(id);
    findToast(id)?.remove();
  };

  const dismiss = (id: string) => {
    const timer = timers.get(id);
    if (timer) clearTimeout(timer);
    timers.delete(id);

    const node = findToast(id);
    if (!node || node.dataset.state === "closed") return;
    const view = document.defaultView;
    const shouldAnimate =
      typeof view?.AnimationEvent === "function" &&
      typeof view.matchMedia === "function" &&
      !view.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!shouldAnimate) {
      finishDismissal(id);
      return;
    }

    node.dataset.state = "closed";
    toastCleanups.get(id)?.add(
      addListener(node, "animationend", (event) => {
        if (event.target === node) finishDismissal(id);
      }),
    );
    removalTimers.set(
      id,
      setTimeout(() => finishDismissal(id), TOAST_EXIT_FALLBACK_MS),
    );
  };

  const toast = (input: ToastInput): string => {
    if (destroyed) return "";
    const id = input.id ?? createId("cf-toast");
    finishDismissal(id);
    const toastCleanup = createCleanup();
    toastCleanups.set(id, toastCleanup);

    const node = document.createElement("div");
    node.className = "cf-toast";
    node.dataset.cfToastId = id;
    node.dataset.state = "open";
    node.dataset.tone = input.tone ?? "neutral";
    node.setAttribute("role", input.tone === "danger" ? "alert" : "status");

    const content = document.createElement("div");
    content.className = "cf-toast__content";
    const title = document.createElement("div");
    title.className = "cf-toast__title";
    title.textContent = input.title;
    content.append(title);
    if (input.description) {
      const description = document.createElement("div");
      description.className = "cf-toast__description";
      description.textContent = input.description;
      content.append(description);
    }
    node.append(content);

    if (input.action) {
      const action = document.createElement("button");
      action.type = "button";
      action.className = "cf-button cf-button--ghost cf-button--sm cf-toast__action";
      action.textContent = input.action.label;
      toastCleanup.add(
        addListener(action, "click", () => {
          input.action?.onClick();
          dismiss(id);
        }),
      );
      node.append(action);
    }

    const close = document.createElement("button");
    close.type = "button";
    close.className = "cf-toast__close";
    close.setAttribute("aria-label", "Dismiss notification");
    close.textContent = "×";
    toastCleanup.add(addListener(close, "click", () => dismiss(id)));
    node.append(close);
    viewport.append(node);

    const duration = input.duration ?? 5000;
    if (duration > 0)
      timers.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
    return id;
  };

  const clear = () => {
    const ids = new Set([...timers.keys(), ...removalTimers.keys(), ...toastCleanups.keys()]);
    for (const node of viewport.querySelectorAll<HTMLElement>("[data-cf-toast-id]")) {
      if (node.dataset.cfToastId) ids.add(node.dataset.cfToastId);
    }
    for (const id of ids) finishDismissal(id);
    for (const node of viewport.querySelectorAll("[data-cf-toast-id]")) node.remove();
  };

  return {
    toast,
    dismiss,
    clear,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clear();
    },
  };
}
