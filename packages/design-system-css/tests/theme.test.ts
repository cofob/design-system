import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createThemeController,
  getThemeScript,
  initDesignSystem,
  resolveThemePreference,
  THEME_STORAGE_KEY,
} from "../src/index.js";

describe("theme controller", () => {
  let dark = false;
  let changeListener: (() => void) | undefined;
  let values: Map<string, string>;

  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-preference");
    document.body.replaceChildren();
    values = new Map();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        get matches() {
          return dark;
        },
        addEventListener: (_type: string, listener: () => void) => {
          changeListener = listener;
        },
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    dark = false;
    changeListener = undefined;
  });

  it("resolves system preferences", () => {
    expect(resolveThemePreference("system", false)).toBe("light");
    expect(resolveThemePreference("system", true)).toBe("dark");
    expect(resolveThemePreference("light", true)).toBe("light");
  });

  it("applies, persists, and subscribes immediately", () => {
    const states: string[] = [];
    const controller = createThemeController({
      root: document.documentElement,
      storage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => {
          values.set(key, value);
        },
      },
    });
    const unsubscribe = controller.subscribe((state) =>
      states.push(`${state.preference}:${state.resolvedTheme}`),
    );

    expect(states).toEqual(["system:light"]);
    controller.setPreference("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.themePreference).toBe("dark");
    expect(values.get(THEME_STORAGE_KEY)).toBe("dark");

    controller.setPreference("system");
    dark = true;
    changeListener?.();
    expect(controller.getResolvedTheme()).toBe("dark");
    expect(states.at(-1)).toBe("system:dark");

    unsubscribe();
    controller.destroy();
  });

  it("returns a synchronous anti-flash script", () => {
    const script = getThemeScript();
    expect(script).toContain("document.documentElement");
    expect(script).toContain("prefers-color-scheme: dark");
    expect(script).toContain("cf-theme");
  });

  it("synchronizes native theme toggles with the root preference", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    document.body.innerHTML = `
      <button type="button" data-cf-theme-toggle>
        <span data-cf-theme-label></span>
      </button>
    `;

    const designSystem = initDesignSystem(document);
    const toggle = document.querySelector<HTMLButtonElement>("[data-cf-theme-toggle]");

    expect(toggle?.dataset.preference).toBe("light");
    expect(toggle?.dataset.theme).toBe("light");
    expect(toggle?.getAttribute("aria-label")).toBe("Light theme. Switch to Dark theme.");

    toggle?.click();
    expect(document.documentElement.dataset.themePreference).toBe("dark");
    expect(toggle?.dataset.preference).toBe("dark");

    designSystem.destroy();
  });
});
