import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDialogController,
  createMenuController,
  createNavbarController,
  createPopoverController,
  createTabsController,
  createToastController,
  createTooltipController,
} from "../src/index.js";

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

function dispatchToggle(element: HTMLElement, newState: "open" | "closed") {
  const event = new Event("toggle");
  Object.defineProperty(event, "newState", { value: newState });
  element.dispatchEvent(event);
}

describe("framework-agnostic controllers", () => {
  it("controls responsive navbar dismissal and preserves interactions inside its actions", async () => {
    document.body.innerHTML = `
      <nav data-cf-navbar data-collapse-at="tablet">
        <details data-cf-navbar-disclosure>
          <summary data-cf-navbar-trigger>Menu</summary>
        </details>
        <div data-cf-navbar-panel>
          <a href="#notes">Notes</a>
          <button id="theme">Theme</button>
        </div>
      </nav>
      <button id="outside">Outside</button>
    `;
    const navbar = document.querySelector<HTMLElement>("[data-cf-navbar]")!;
    const disclosure = navbar.querySelector<HTMLDetailsElement>("details")!;
    const trigger = navbar.querySelector<HTMLElement>("summary")!;
    const theme = navbar.querySelector<HTMLElement>("#theme")!;
    const outside = document.querySelector<HTMLElement>("#outside")!;
    const onOpenChange = vi.fn();
    const controller = createNavbarController(navbar, { onOpenChange });

    controller.open();
    expect(disclosure.open).toBe(true);
    expect(navbar.dataset.state).toBe("open");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    theme.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(controller.isOpen()).toBe(true);

    outside.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(controller.isOpen()).toBe(false);

    controller.open();
    trigger.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(controller.isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);

    controller.open();
    navbar.querySelector<HTMLAnchorElement>("a")!.click();
    expect(controller.isOpen()).toBe(false);
    expect(onOpenChange.mock.calls).toEqual([[true], [false], [true], [false], [true], [false]]);
    controller.destroy();
  });

  it("opens and closes a dialog while synchronizing its trigger", async () => {
    document.body.innerHTML = `
      <button id="trigger">Open</button>
      <dialog id="dialog"><button data-cf-dialog-close>Close</button></dialog>
    `;
    const trigger = document.querySelector<HTMLElement>("#trigger")!;
    const dialog = document.querySelector<HTMLDialogElement>("#dialog")!;
    const controller = createDialogController(dialog, { triggers: trigger });

    trigger.click();
    expect(controller.isOpen()).toBe(true);
    expect(dialog.dataset.state).toBe("open");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    dialog.querySelector<HTMLElement>("[data-cf-dialog-close]")!.click();
    await Promise.resolve();
    expect(controller.isOpen()).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    controller.destroy();
  });

  it("emits each dialog transition once and not during initialization", async () => {
    document.body.innerHTML = `
      <button id="trigger">Open</button>
      <dialog id="dialog"><button>First focus</button></dialog>
    `;
    const trigger = document.querySelector<HTMLElement>("#trigger")!;
    const dialog = document.querySelector<HTMLDialogElement>("#dialog")!;
    const onOpenChange = vi.fn();
    Object.defineProperty(dialog, "showModal", {
      configurable: true,
      value: () => dialog.setAttribute("open", ""),
    });
    Object.defineProperty(dialog, "close", {
      configurable: true,
      value: () => {
        dialog.removeAttribute("open");
        dialog.dispatchEvent(new Event("close"));
      },
    });

    const controller = createDialogController(dialog, { triggers: trigger, onOpenChange });
    expect(onOpenChange).not.toHaveBeenCalled();

    trigger.focus();
    controller.open();
    controller.close();
    await Promise.resolve();

    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    expect(document.activeElement).toBe(trigger);
    controller.destroy();
  });

  it("uses manual popover semantics when one native light-dismiss path is disabled", async () => {
    document.body.innerHTML = `
      <button id="trigger">Open</button>
      <div id="popover"></div>
      <button id="outside">Outside</button>
    `;
    const trigger = document.querySelector<HTMLElement>("#trigger")!;
    const popover = document.querySelector<HTMLElement>("#popover")!;
    const outside = document.querySelector<HTMLElement>("#outside")!;
    const onOpenChange = vi.fn();
    Object.defineProperty(popover, "showPopover", {
      configurable: true,
      value: () => dispatchToggle(popover, "open"),
    });
    Object.defineProperty(popover, "hidePopover", {
      configurable: true,
      value: () => dispatchToggle(popover, "closed"),
    });

    const controller = createPopoverController(popover, {
      triggers: trigger,
      closeOnEscape: false,
      closeOnOutsideClick: true,
      onOpenChange,
    });
    expect(popover.getAttribute("popover")).toBe("manual");
    expect(onOpenChange).not.toHaveBeenCalled();

    trigger.focus();
    trigger.click();
    expect(popover.hasAttribute("data-cf-fallback-open")).toBe(false);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(controller.isOpen()).toBe(true);

    outside.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    await Promise.resolve();
    expect(controller.isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    controller.destroy();
  });

  it("supports fallback popovers and menu keyboard navigation", async () => {
    document.body.innerHTML = `
      <button id="trigger">Menu</button>
      <div id="menu" class="cf-menu" role="menu">
        <button role="menuitem">Alpha</button>
        <button role="menuitem">Beta</button>
      </div>
    `;
    const trigger = document.querySelector<HTMLElement>("#trigger")!;
    const menu = document.querySelector<HTMLElement>("#menu")!;
    const controller = createMenuController(menu, { trigger });
    const [alpha, beta] = Array.from(menu.querySelectorAll<HTMLElement>("[role='menuitem']"));

    expect(alpha?.tabIndex).toBe(0);
    expect(beta?.tabIndex).toBe(-1);

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await Promise.resolve();
    expect(controller.isOpen()).toBe(true);
    expect(menu.dataset.cfFallbackOpen).toBe("true");
    expect(document.activeElement?.textContent).toBe("Alpha");

    menu.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(document.activeElement?.textContent).toBe("Beta");
    expect(alpha?.tabIndex).toBe(-1);
    expect(beta?.tabIndex).toBe(0);

    menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await Promise.resolve();
    expect(document.activeElement).toBe(trigger);
    controller.destroy();
    expect(alpha?.hasAttribute("tabindex")).toBe(false);
    expect(beta?.hasAttribute("tabindex")).toBe(false);
  });

  it("positions fallback popovers at their trigger, flips on collision, and restores inline styles", () => {
    document.body.innerHTML = `
      <button id="trigger">Open</button>
      <div id="popover" style="color: red"></div>
    `;
    const trigger = document.querySelector<HTMLElement>("#trigger")!;
    const popover = document.querySelector<HTMLElement>("#popover")!;
    Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: 800 });
    Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 800 });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 740,
      top: 740,
      right: 180,
      bottom: 780,
      left: 100,
      width: 80,
      height: 40,
      toJSON: () => ({}),
    });
    vi.spyOn(popover, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 200,
      bottom: 100,
      left: 0,
      width: 200,
      height: 100,
      toJSON: () => ({}),
    });

    const controller = createPopoverController(popover, { triggers: trigger, placement: "bottom" });
    controller.open();

    expect(popover.dataset.cfPositioned).toBe("fallback");
    expect(popover.dataset.cfResolvedPlacement).toBe("top");
    expect(popover.style.position).toBe("fixed");
    expect(popover.style.left).toBe("100px");
    expect(popover.style.top).toBe("632px");

    controller.destroy();
    expect(popover.style.position).toBe("");
    expect(popover.style.left).toBe("");
    expect(popover.style.top).toBe("");
    expect(popover.style.color).toBe("red");
    expect(popover.hasAttribute("data-cf-positioned")).toBe(false);
    expect(popover.hasAttribute("data-placement")).toBe(false);
  });

  it("treats a separate positioning anchor as part of the popover interaction", () => {
    document.body.innerHTML = `
      <button id="anchor">Toggle</button>
      <div id="popover" data-cf-fallback-open="true"></div>
      <button id="outside">Outside</button>
    `;
    const anchor = document.querySelector<HTMLElement>("#anchor")!;
    const popover = document.querySelector<HTMLElement>("#popover")!;
    const outside = document.querySelector<HTMLElement>("#outside")!;
    const controller = createPopoverController(popover, { triggers: [], anchor });

    anchor.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(controller.isOpen()).toBe(true);

    outside.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(controller.isOpen()).toBe(false);
    controller.destroy();
  });

  it("synchronizes tab state and keyboard activation", () => {
    document.body.innerHTML = `
      <div id="tabs">
        <div role="tablist">
          <button id="one" role="tab" data-value="one" aria-controls="panel-one">One</button>
          <button id="two" role="tab" data-value="two" aria-controls="panel-two">Two</button>
        </div>
        <section id="panel-one" role="tabpanel" aria-labelledby="one">First</section>
        <section id="panel-two" role="tabpanel" aria-labelledby="two">Second</section>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("#tabs")!;
    const controller = createTabsController(root, { defaultValue: "one" });
    const one = document.querySelector<HTMLElement>("#one")!;
    const two = document.querySelector<HTMLElement>("#two")!;

    one.focus();
    one.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(controller.getValue()).toBe("two");
    expect(two.getAttribute("aria-selected")).toBe("true");
    expect(document.querySelector<HTMLElement>("#panel-one")!.hidden).toBe(true);
    controller.destroy();
  });

  it("links tab panels and skips disabled boundary tabs", () => {
    document.body.innerHTML = `
      <div id="tabs-boundaries">
        <div role="tablist">
          <button role="tab" data-value="disabled-first" disabled>Disabled first</button>
          <button role="tab" data-value="first">First</button>
          <button role="tab" data-value="last">Last</button>
          <button role="tab" data-value="disabled-last" disabled>Disabled last</button>
        </div>
        <section role="tabpanel">Disabled first panel</section>
        <section role="tabpanel">First panel</section>
        <section role="tabpanel">Last panel</section>
        <section role="tabpanel">Disabled last panel</section>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("#tabs-boundaries")!;
    const controller = createTabsController(root, { defaultValue: "last" });
    const tabs = Array.from(root.querySelectorAll<HTMLElement>("[role='tab']"));
    const panels = Array.from(root.querySelectorAll<HTMLElement>("[role='tabpanel']"));
    const first = tabs[1]!;
    const last = tabs[2]!;

    expect(first.getAttribute("aria-controls")).toBe(panels[1]?.id);
    expect(panels[1]?.getAttribute("aria-labelledby")).toBe(first.id);

    last.focus();
    last.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(document.activeElement).toBe(first);
    expect(controller.getValue()).toBe("first");

    first.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(document.activeElement).toBe(last);
    expect(controller.getValue()).toBe("last");
    controller.destroy();
  });

  it("keeps a tooltip open while either hover or focus remains active and cleans up", () => {
    document.body.innerHTML = `
      <button id="trigger" aria-describedby="existing">Help</button>
      <span id="existing">Existing description</span>
      <span id="tooltip">Tooltip description</span>
    `;
    const trigger = document.querySelector<HTMLElement>("#trigger")!;
    const tooltip = document.querySelector<HTMLElement>("#tooltip")!;
    tooltip.removeAttribute("id");
    const controller = createTooltipController(tooltip, { triggers: trigger, delay: 0 });
    const generatedId = tooltip.id;

    expect(generatedId).toMatch(/^cf-tooltip-/);
    expect(trigger.getAttribute("aria-describedby")?.split(" ")).toEqual(["existing", generatedId]);

    trigger.focus();
    trigger.dispatchEvent(new MouseEvent("mouseenter"));
    trigger.dispatchEvent(new MouseEvent("mouseleave"));
    expect(controller.isOpen()).toBe(true);

    trigger.blur();
    expect(controller.isOpen()).toBe(false);

    trigger.dispatchEvent(new MouseEvent("mouseenter"));
    trigger.focus();
    trigger.blur();
    expect(controller.isOpen()).toBe(true);
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(controller.isOpen()).toBe(false);

    controller.destroy();
    expect(trigger.getAttribute("aria-describedby")).toBe("existing");
    expect(tooltip.hasAttribute("id")).toBe(false);
    trigger.dispatchEvent(new MouseEvent("mouseenter"));
    expect(controller.isOpen()).toBe(false);
  });

  it("delays tooltip hover by one second and pins it on click", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <button id="trigger">Help</button>
      <span id="tooltip">Tooltip description</span>
      <button id="outside">Outside</button>
    `;
    const trigger = document.querySelector<HTMLElement>("#trigger")!;
    const tooltip = document.querySelector<HTMLElement>("#tooltip")!;
    const outside = document.querySelector<HTMLElement>("#outside")!;
    Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: 800 });
    Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 600 });
    trigger.getBoundingClientRect = () =>
      ({
        x: 320,
        y: 240,
        top: 240,
        right: 360,
        bottom: 280,
        left: 320,
        width: 40,
        height: 40,
        toJSON: () => ({}),
      }) as DOMRect;
    tooltip.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        top: 0,
        right: 120,
        bottom: 32,
        left: 0,
        width: 120,
        height: 32,
        toJSON: () => ({}),
      }) as DOMRect;
    const controller = createTooltipController(tooltip, { triggers: trigger, placement: "top" });

    trigger.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(999);
    expect(controller.isOpen()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(controller.isOpen()).toBe(true);
    expect(tooltip.dataset.cfPositioned).toBe("fallback");
    expect(tooltip.dataset.cfResolvedPlacement).toBe("top");
    expect(tooltip.style.position).toBe("fixed");
    expect(tooltip.style.left).toBe("280px");
    expect(tooltip.style.top).toBe("200px");

    trigger.dispatchEvent(new MouseEvent("mouseleave"));
    expect(controller.isOpen()).toBe(false);

    trigger.click();
    expect(controller.isOpen()).toBe(true);
    trigger.dispatchEvent(new MouseEvent("mouseleave"));
    expect(controller.isOpen()).toBe(true);

    outside.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(controller.isOpen()).toBe(false);
    controller.destroy();
    expect(tooltip.hasAttribute("data-cf-positioned")).toBe(false);
    expect(tooltip.hasAttribute("data-placement")).toBe(false);
  });

  it("renders toast text without interpreting markup", () => {
    vi.useFakeTimers();
    const viewport = document.createElement("div");
    document.body.append(viewport);
    const controller = createToastController(viewport);
    const id = controller.toast({ title: "<strong>Saved</strong>", duration: 100 });

    expect(viewport.querySelector("strong")).toBeNull();
    expect(viewport.textContent).toContain("<strong>Saved</strong>");
    vi.advanceTimersByTime(100);
    expect(viewport.querySelector(`[data-cf-toast-id="${id}"]`)).toBeNull();
    controller.destroy();
  });

  it("replaces toast timers by id and clears persistent toasts on destroy", () => {
    vi.useFakeTimers();
    const viewport = document.createElement("div");
    document.body.append(viewport);
    const controller = createToastController(viewport);

    controller.toast({ id: "saved", title: "First", duration: 100 });
    vi.advanceTimersByTime(50);
    controller.toast({ id: "saved", title: "Replacement", duration: 200 });
    vi.advanceTimersByTime(50);
    expect(viewport.textContent).toContain("Replacement");
    vi.advanceTimersByTime(150);
    expect(viewport.querySelector('[data-cf-toast-id="saved"]')).toBeNull();

    controller.toast({ id: "persistent", title: "Persistent", duration: 0 });
    controller.destroy();
    expect(viewport.querySelector("[data-cf-toast-id]")).toBeNull();
  });
});
