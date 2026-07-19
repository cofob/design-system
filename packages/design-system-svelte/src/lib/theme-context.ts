import type { ThemePreference } from "./types.js";

export const THEME_CONTEXT = Symbol("cofob-theme");

export interface ThemeContext {
  readonly preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export function resolvedTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(preference: ThemePreference, root?: HTMLElement): void {
  if (typeof document === "undefined") return;
  const target = root ?? document.documentElement;
  target.dataset.themePreference = preference;
  target.dataset.theme = resolvedTheme(preference);
  target.style.colorScheme = target.dataset.theme;
}
