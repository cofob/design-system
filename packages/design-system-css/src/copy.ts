import { addListener, createCleanup, defaultRoot, eventElement, ownerDocument } from "./internal/dom.js";
import type { Controller, DesignSystemRoot } from "./types.js";

export interface CopyControllerOptions {
  copiedDuration?: number;
  writeText?: (value: string) => Promise<void>;
}

export interface CopyController extends Controller {
  copy(value: string): Promise<boolean>;
}

/** Copies text without accessing browser globals during module import. */
export async function copyText(value: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("The Clipboard API is unavailable.");
  }
  await navigator.clipboard.writeText(value);
}

function setCopyState(button: HTMLButtonElement, state: "idle" | "copied" | "error"): void {
  const scope = button.closest<HTMLElement>("[data-cf-copy-scope]");
  const label = button.querySelector<HTMLElement>("[data-cf-copy-label]");
  const status = scope?.querySelector<HTMLElement>("[data-cf-copy-status]");
  const copyLabel = button.dataset.copyLabel ?? "Copy";
  const copiedLabel = button.dataset.copiedLabel ?? "Copied";
  const errorLabel = button.dataset.copyErrorLabel ?? "Try again";

  button.dataset.copyState = state;
  if (state === "copied") {
    if (label) label.textContent = copiedLabel;
    button.setAttribute("aria-label", button.dataset.copiedAriaLabel ?? "Copied to clipboard");
    if (status) status.textContent = "Copied to clipboard.";
    return;
  }
  if (state === "error") {
    if (label) label.textContent = errorLabel;
    button.setAttribute("aria-label", button.dataset.copyErrorAriaLabel ?? "Copy failed. Try again");
    if (status) status.textContent = "Could not copy to clipboard.";
    return;
  }
  if (label) label.textContent = copyLabel;
  button.setAttribute("aria-label", button.dataset.copyAriaLabel ?? copyLabel);
  if (status) status.textContent = "";
}

/** Enhances native `[data-cf-copy-button]` controls below a root. */
export function createCopyController(
  root: DesignSystemRoot | null = defaultRoot(),
  options: CopyControllerOptions = {},
): CopyController {
  const cleanup = createCleanup();
  const resetTimers = new Map<HTMLButtonElement, number>();
  const writeText = options.writeText ?? copyText;
  const copiedDuration = options.copiedDuration ?? 1800;

  const clearReset = (button: HTMLButtonElement): void => {
    const timer = resetTimers.get(button);
    if (timer === undefined) return;
    const document = ownerDocument(button);
    document.defaultView?.clearTimeout(timer);
    resetTimers.delete(button);
  };

  const copy = async (value: string): Promise<boolean> => {
    try {
      await writeText(value);
      return true;
    } catch {
      return false;
    }
  };

  if (root) {
    cleanup.add(
      addListener(root, "click", (event) => {
        const button = eventElement(event)?.closest<HTMLButtonElement>("[data-cf-copy-button]");
        if (!button || button.dataset.cfCopyManaged === "true" || button.disabled) return;
        const scope = button.closest<HTMLElement>("[data-cf-copy-scope]");
        const source = scope?.querySelector<HTMLElement>("[data-cf-copy-source]");
        if (!scope || !source) return;

        clearReset(button);
        void copy(source.textContent ?? "").then((succeeded) => {
          setCopyState(button, succeeded ? "copied" : "error");
          const document = ownerDocument(button);
          const timer = document.defaultView?.setTimeout(() => {
            setCopyState(button, "idle");
            resetTimers.delete(button);
          }, copiedDuration);
          if (timer !== undefined) resetTimers.set(button, timer);
        });
      }),
    );
  }

  return {
    copy,
    destroy() {
      cleanup.destroy();
      for (const [button] of resetTimers) clearReset(button);
    },
  };
}
