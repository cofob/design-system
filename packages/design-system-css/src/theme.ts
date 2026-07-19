import type { Controller, ResolvedTheme, ThemePreference, ThemeState } from "./types.js";

export const THEME_STORAGE_KEY = "cf-theme";

export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ThemeControllerOptions {
  root?: HTMLElement | null;
  defaultPreference?: ThemePreference;
  storage?: ThemeStorage | null;
  storageKey?: string;
}

export interface ThemeController extends Controller {
  getPreference(): ThemePreference;
  getResolvedTheme(): ResolvedTheme;
  setPreference(preference: ThemePreference): void;
  subscribe(listener: (state: ThemeState) => void): () => void;
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveThemePreference(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  return preference === "system" ? (systemDark ? "dark" : "light") : preference;
}

export function applyThemePreference(
  root: HTMLElement,
  preference: ThemePreference,
  systemDark: boolean,
): ThemeState {
  const resolvedTheme = resolveThemePreference(preference, systemDark);
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;
  return { preference, resolvedTheme };
}

function browserRoot(): HTMLElement | null {
  return typeof document === "undefined" ? null : document.documentElement;
}

function browserStorage(root: HTMLElement | null): ThemeStorage | null {
  try {
    return root?.ownerDocument.defaultView?.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createThemeController(options: ThemeControllerOptions = {}): ThemeController {
  const root = options.root === undefined ? browserRoot() : options.root;
  const storage = options.storage === undefined ? browserStorage(root) : options.storage;
  const storageKey = options.storageKey ?? THEME_STORAGE_KEY;
  const view = root?.ownerDocument.defaultView ?? null;
  const media = view?.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
  const listeners = new Set<(state: ThemeState) => void>();
  let destroyed = false;
  let preference = options.defaultPreference ?? "system";

  try {
    const stored = storage?.getItem(storageKey) ?? null;
    if (isThemePreference(stored)) preference = stored;
  } catch {
    // Storage may be disabled by browser privacy settings.
  }

  let state: ThemeState = root
    ? applyThemePreference(root, preference, media?.matches ?? false)
    : { preference, resolvedTheme: resolveThemePreference(preference, false) };

  const notify = () => {
    for (const listener of listeners) listener(state);
  };

  const update = () => {
    state = root
      ? applyThemePreference(root, preference, media?.matches ?? false)
      : { preference, resolvedTheme: resolveThemePreference(preference, media?.matches ?? false) };
    notify();
  };

  const onSystemChange = () => {
    if (preference === "system") update();
  };
  media?.addEventListener?.("change", onSystemChange);

  return {
    getPreference: () => preference,
    getResolvedTheme: () => state.resolvedTheme,
    setPreference(nextPreference) {
      if (destroyed || !isThemePreference(nextPreference)) return;
      preference = nextPreference;
      try {
        storage?.setItem(storageKey, preference);
      } catch {
        // The visual preference still applies if persistence is unavailable.
      }
      update();
    },
    subscribe(listener) {
      if (destroyed) return () => undefined;
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      media?.removeEventListener?.("change", onSystemChange);
      listeners.clear();
    },
  };
}

export function getThemeScript(storageKey = THEME_STORAGE_KEY): string {
  const serializedKey = JSON.stringify(storageKey).replaceAll("<", "\\u003c");
  return `(()=>{try{const e=document.documentElement,k=${serializedKey},v=localStorage.getItem(k),p=v==="light"||v==="dark"||v==="system"?v:"system",d=p==="system"?matchMedia("(prefers-color-scheme: dark)").matches:p==="dark",t=d?"dark":"light";e.dataset.theme=t;e.dataset.themePreference=p;e.style.colorScheme=t}catch{}})();`;
}
