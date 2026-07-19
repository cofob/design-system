import { writable } from "svelte/store";
import type { ToastInput, ToastOptions, ToastRecord } from "./types.js";

export const toasts = writable<ToastRecord[]>([]);
export const activeToastViewport = writable<string | null>(null);

let sequence = 0;
let viewportCount = 0;
const viewportOrder: string[] = [];
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const exitTimers = new Map<string, ReturnType<typeof setTimeout>>();
const TOAST_EXIT_FALLBACK_MS = 250;

export function toast(input: ToastInput): string;
export function toast(message: string, options?: ToastOptions): string;
export function toast(input: string | ToastInput, options: ToastOptions = {}): string {
  const normalized: ToastInput =
    typeof input === "string"
      ? {
          title: options.title ?? input,
          ...(options.title ? { description: input } : {}),
          ...(options.id ? { id: options.id } : {}),
          ...(options.tone ? { tone: options.tone } : {}),
          ...(options.duration === undefined ? {} : { duration: options.duration }),
        }
      : input;
  const id = normalized.id ?? `cf-toast-${++sequence}`;
  const duration = normalized.duration ?? 5000;
  const record: ToastRecord = {
    id,
    title: normalized.title,
    tone: normalized.tone ?? "neutral",
    duration,
    state: "open",
    ...(normalized.description === undefined ? {} : { description: normalized.description }),
    ...(typeof input === "string" && options.actionLabel ? { actionLabel: options.actionLabel } : {}),
    ...(typeof input === "string" && options.onAction ? { onAction: options.onAction } : {}),
  };

  if (typeof window === "undefined") return id;

  finishToastDismissal(id);
  toasts.update((current) => [...current.filter((item) => item.id !== id), record]);

  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => dismissToast(id), duration),
    );
  }
  return id;
}

export function dismissToast(id: string): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  const shouldAnimate =
    typeof window !== "undefined" &&
    typeof window.AnimationEvent === "function" &&
    typeof window.matchMedia === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let found = false;
  toasts.update((current) => {
    if (!current.some((item) => item.id === id && item.state !== "closed")) return current;
    found = true;
    return shouldAnimate
      ? current.map((item) => (item.id === id ? { ...item, state: "closed" as const } : item))
      : current.filter((item) => item.id !== id);
  });
  if (found && shouldAnimate) {
    exitTimers.set(
      id,
      setTimeout(() => finishToastDismissal(id), TOAST_EXIT_FALLBACK_MS),
    );
  }
}

export function finishToastDismissal(id: string): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  const exitTimer = exitTimers.get(id);
  if (exitTimer) clearTimeout(exitTimer);
  exitTimers.delete(id);
  toasts.update((current) => current.filter((item) => item.id !== id));
}

export function clearToasts(): void {
  for (const timer of timers.values()) clearTimeout(timer);
  for (const timer of exitTimers.values()) clearTimeout(timer);
  timers.clear();
  exitTimers.clear();
  toasts.set([]);
}

export function registerToastViewport(id: string): () => void {
  viewportCount += 1;
  if (!viewportOrder.includes(id)) viewportOrder.push(id);
  activeToastViewport.update((current) => current ?? viewportOrder[0] ?? null);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    viewportCount = Math.max(0, viewportCount - 1);
    const index = viewportOrder.indexOf(id);
    if (index >= 0) viewportOrder.splice(index, 1);
    activeToastViewport.update((current) => (current === id ? (viewportOrder[0] ?? null) : current));
    if (viewportCount === 0) {
      activeToastViewport.set(null);
      clearToasts();
    }
  };
}
