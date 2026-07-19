import { addListener, createCleanup, createId, focusElement, isDisabled, queryAll } from "./internal/dom.js";
import type { Controller } from "./types.js";

export interface TabsControllerOptions {
  value?: string;
  defaultValue?: string;
  orientation?: "horizontal" | "vertical";
  activation?: "automatic" | "manual";
  onValueChange?: (value: string) => void;
}

export interface TabsController extends Controller {
  getValue(): string;
  setValue(value: string, focus?: boolean): void;
}

function tabValue(tab: HTMLElement, index: number): string {
  return tab.dataset.value ?? tab.getAttribute("aria-controls") ?? String(index);
}

export function createTabsController(root: HTMLElement, options: TabsControllerOptions = {}): TabsController {
  const cleanup = createCleanup();
  const tabs = queryAll<HTMLElement>(root, '[role="tab"]');
  const panels = queryAll<HTMLElement>(root, '[role="tabpanel"]');
  const orientation = options.orientation ?? root.getAttribute("aria-orientation") ?? "horizontal";
  const values = tabs.map((tab, index) => tabValue(tab, index));
  const idPrefix = root.id || createId("cf-tabs");

  tabs.forEach((tab, index) => {
    if (!tab.id) tab.id = `${idPrefix}-tab-${index + 1}`;
  });
  const linkedPanels = tabs.map((tab, index) => {
    const controlledId = tab.getAttribute("aria-controls");
    const panel =
      (controlledId ? panels.find((candidate) => candidate.id === controlledId) : undefined) ??
      panels.find((candidate) => candidate.getAttribute("aria-labelledby") === tab.id) ??
      panels[index];
    if (!panel) return null;
    if (!panel.id) panel.id = `${idPrefix}-panel-${index + 1}`;
    tab.setAttribute("aria-controls", panel.id);
    panel.setAttribute("aria-labelledby", tab.id);
    return panel;
  });
  const valueAt = (index: number): string => values[index] ?? String(index);
  let currentValue = options.value ?? options.defaultValue ?? valueAt(0);

  const render = (value: string) => {
    currentValue = value;
    tabs.forEach((tab, index) => {
      const selected = valueAt(index) === value;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.dataset.state = selected ? "active" : "inactive";
    });
    panels.forEach((panel) => {
      const linkedIndex = linkedPanels.indexOf(panel);
      const active = linkedIndex >= 0 && valueAt(linkedIndex) === value;
      panel.hidden = !active;
      panel.dataset.state = active ? "active" : "inactive";
    });
  };

  const setValue = (value: string, focus = false) => {
    const index = tabs.findIndex((tab, tabIndex) => valueAt(tabIndex) === value && !isDisabled(tab));
    if (index < 0) return;
    const changed = currentValue !== value;
    render(value);
    if (changed) options.onValueChange?.(value);
    if (focus) focusElement(tabs[index]);
  };

  const move = (from: number, offset: number) => {
    let next = from;
    for (let count = 0; count < tabs.length; count += 1) {
      next = (next + offset + tabs.length) % tabs.length;
      const tab = tabs[next];
      if (tab && !isDisabled(tab)) {
        focusElement(tab);
        if ((options.activation ?? "automatic") === "automatic") setValue(valueAt(next));
        break;
      }
    }
  };
  const moveToBoundary = (boundary: "first" | "last") => {
    const indices = tabs.map((_, index) => index);
    if (boundary === "last") indices.reverse();
    const targetIndex = indices.find((index) => {
      const tab = tabs[index];
      return tab ? !isDisabled(tab) : false;
    });
    if (targetIndex === undefined) return;
    const target = tabs[targetIndex];
    focusElement(target);
    if (target && (options.activation ?? "automatic") === "automatic") setValue(valueAt(targetIndex));
  };

  tabs.forEach((tab, index) => {
    cleanup.add(
      addListener(tab, "click", () => {
        if (!isDisabled(tab)) setValue(valueAt(index));
      }),
    );
    cleanup.add(
      addListener(tab, "keydown", (event) => {
        const keyboardEvent = event as KeyboardEvent;
        const previousKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
        const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
        if (keyboardEvent.key === previousKey || keyboardEvent.key === nextKey) {
          keyboardEvent.preventDefault();
          move(index, keyboardEvent.key === nextKey ? 1 : -1);
        } else if (keyboardEvent.key === "Home" || keyboardEvent.key === "End") {
          keyboardEvent.preventDefault();
          moveToBoundary(keyboardEvent.key === "Home" ? "first" : "last");
        } else if (
          (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") &&
          (options.activation ?? "automatic") === "manual"
        ) {
          keyboardEvent.preventDefault();
          setValue(tabValue(tab, index));
        }
      }),
    );
  });

  root.setAttribute("data-orientation", orientation);
  root.querySelector('[role="tablist"]')?.setAttribute("aria-orientation", orientation);
  render(currentValue);

  return {
    getValue: () => currentValue,
    setValue,
    destroy: cleanup.destroy,
  };
}
