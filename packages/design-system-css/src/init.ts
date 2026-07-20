import { createAccordionController } from "./accordion.js";
import {
  createAnimatedStickerController,
  createAnimatedStickerToggleController,
} from "./animated-sticker.js";
import { createCopyController } from "./copy.js";
import { createDialogController } from "./dialog.js";
import { addListener, createCleanup, defaultRoot, queryAll } from "./internal/dom.js";
import { createMenuController } from "./menu.js";
import { createNavbarController } from "./navbar.js";
import { createPopoverController } from "./popover.js";
import { createTabsController } from "./tabs.js";
import { createThemeController, type ThemeController } from "./theme.js";
import { createToastController } from "./toast.js";
import { createTooltipController } from "./tooltip.js";
import type { Controller, DesignSystemRoot, ThemePreference } from "./types.js";

export interface DesignSystemController extends Controller {
  theme: ThemeController;
}

function rootElement(root: DesignSystemRoot): HTMLElement | null {
  if (root.nodeType === 9) return (root as Document).documentElement;
  const document = root.ownerDocument;
  return document?.documentElement ?? null;
}

function isPreference(value: string | undefined): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function initDesignSystem(root: DesignSystemRoot | null = defaultRoot()): DesignSystemController {
  const cleanup = createCleanup();
  const theme = createThemeController({ root: root ? rootElement(root) : null });

  if (!root) return { theme, destroy: () => theme.destroy() };

  const controllers: Controller[] = [];
  controllers.push(createCopyController(root));
  for (const element of queryAll<HTMLElement>(root, "[data-cf-animated-sticker]")) {
    if (!element.hasAttribute("data-cf-animated-sticker-managed")) {
      controllers.push(createAnimatedStickerController(element));
    }
  }
  for (const toggle of queryAll<HTMLInputElement>(root, "input[data-cf-animated-sticker-toggle]")) {
    if (!toggle.hasAttribute("data-cf-animated-sticker-toggle-managed")) {
      controllers.push(createAnimatedStickerToggleController(toggle));
    }
  }
  for (const element of queryAll<HTMLElement>(root, "[data-cf-navbar]")) {
    if (!element.hasAttribute("data-cf-navbar-managed")) controllers.push(createNavbarController(element));
  }
  for (const element of queryAll<HTMLDialogElement>(root, "dialog[data-cf-dialog], dialog.cf-dialog")) {
    controllers.push(createDialogController(element));
  }
  for (const element of queryAll<HTMLElement>(root, "[data-cf-popover]")) {
    if (!element.matches("[data-cf-menu], [data-cf-tooltip]"))
      controllers.push(createPopoverController(element));
  }
  for (const element of queryAll<HTMLElement>(root, "[data-cf-menu]")) {
    controllers.push(createMenuController(element));
  }
  for (const element of queryAll<HTMLElement>(root, "[data-cf-tabs]")) {
    controllers.push(createTabsController(element));
  }
  for (const element of queryAll<HTMLElement>(root, "[data-cf-accordion]")) {
    controllers.push(createAccordionController(element));
  }
  for (const element of queryAll<HTMLElement>(root, "[data-cf-tooltip]")) {
    controllers.push(createTooltipController(element));
  }
  for (const element of queryAll<HTMLElement>(root, "[data-cf-toast-viewport]")) {
    controllers.push(createToastController(element));
  }

  const themeToggles = queryAll<HTMLElement>(root, "[data-cf-theme-toggle]");
  const automaticLabels = new Set(
    themeToggles.filter(
      (toggle) => !toggle.hasAttribute("aria-label") || toggle.hasAttribute("data-cf-theme-label-auto"),
    ),
  );
  const automaticTitles = new Set(themeToggles.filter((toggle) => !toggle.hasAttribute("title")));
  const themeNames: Record<ThemePreference, string> = {
    system: "System theme",
    light: "Light theme",
    dark: "Dark theme",
  };
  cleanup.add(
    theme.subscribe(({ preference, resolvedTheme }) => {
      const next = preference === "light" ? "dark" : preference === "dark" ? "system" : "light";
      for (const toggle of themeToggles) {
        toggle.dataset.preference = preference;
        toggle.dataset.theme = resolvedTheme;
        if (automaticLabels.has(toggle)) {
          toggle.setAttribute("aria-label", `${themeNames[preference]}. Switch to ${themeNames[next]}.`);
        }
        if (automaticTitles.has(toggle)) toggle.setAttribute("title", themeNames[preference]);
      }
    }),
  );

  for (const toggle of themeToggles) {
    cleanup.add(
      addListener(toggle, "click", () => {
        const requested = toggle.dataset.themeValue;
        if (isPreference(requested)) {
          theme.setPreference(requested);
          return;
        }
        const current = theme.getPreference();
        theme.setPreference(current === "light" ? "dark" : current === "dark" ? "system" : "light");
      }),
    );
  }

  return {
    theme,
    destroy() {
      cleanup.destroy();
      for (const controller of controllers.reverse()) controller.destroy();
      theme.destroy();
    },
  };
}
