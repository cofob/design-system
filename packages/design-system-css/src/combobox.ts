import {
  addListener,
  createCleanup,
  createId,
  eventElement,
  isDisabled,
  ownerDocument,
  queryAll,
} from "./internal/dom.js";
import type { Controller } from "./types.js";

export interface ComboboxControllerOptions {
  openOnFocus?: boolean;
  onValueChange?: (value: string, label: string) => void;
}

export interface ComboboxController extends Controller {
  open(): void;
  close(): void;
  select(value: string): void;
  getValue(): string;
  isOpen(): boolean;
}

interface OptionRecord {
  element: HTMLElement;
  value: string;
  label: string;
  originalHidden: boolean;
  originalId: string | null;
  originalSelected: string | null;
}

/** Enhances the shared input/listbox combobox markup with filtering and complete keyboard navigation. */
export function createComboboxController(
  root: HTMLElement,
  options: ComboboxControllerOptions = {},
): ComboboxController {
  const cleanup = createCleanup();
  const document = ownerDocument(root);
  const input = root.querySelector<HTMLInputElement>("[data-cf-combobox-input], [role='combobox']");
  const listbox = root.querySelector<HTMLElement>("[data-cf-combobox-listbox], [role='listbox']");
  const valueInput = root.querySelector<HTMLInputElement>("[data-cf-combobox-value]");

  if (!input || !listbox) {
    throw new Error("Combobox requires an input and a listbox.");
  }

  const generatedListboxId = !listbox.id;
  if (generatedListboxId) listbox.id = createId("cf-combobox-listbox");
  const originalInputAttributes = new Map<string, string | null>();
  for (const attribute of ["aria-autocomplete", "aria-controls", "aria-expanded", "aria-activedescendant"]) {
    originalInputAttributes.set(attribute, input.getAttribute(attribute));
  }
  const originalRootState = root.getAttribute("data-state");
  const originalRootValue = root.getAttribute("data-value");
  const originalListboxHidden = listbox.hidden;
  const records: OptionRecord[] = queryAll<HTMLElement>(
    listbox,
    "[role='option'], [data-cf-combobox-option]",
  ).map((element) => ({
    element,
    value: element.dataset.value ?? element.getAttribute("value") ?? element.textContent?.trim() ?? "",
    label: element.dataset.label ?? element.textContent?.trim() ?? "",
    originalHidden: element.hidden,
    originalId: element.getAttribute("id"),
    originalSelected: element.getAttribute("aria-selected"),
  }));
  records.forEach((record) => {
    if (!record.element.id) record.element.id = createId("cf-combobox-option");
    if (!record.element.hasAttribute("role")) record.element.setAttribute("role", "option");
  });

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", listbox.id);
  listbox.setAttribute("role", "listbox");

  let openState = false;
  let active: OptionRecord | null = null;
  let selectedValue = valueInput?.value ?? root.dataset.value ?? "";

  const visibleRecords = () =>
    records.filter((record) => !record.element.hidden && !isDisabled(record.element));
  const setActive = (record: OptionRecord | null) => {
    active = record;
    for (const candidate of records) candidate.element.toggleAttribute("data-active", candidate === record);
    if (record) input.setAttribute("aria-activedescendant", record.element.id);
    else input.removeAttribute("aria-activedescendant");
    record?.element.scrollIntoView?.({ block: "nearest" });
  };
  const syncSelection = () => {
    for (const record of records) {
      record.element.setAttribute("aria-selected", String(record.value === selectedValue));
    }
    root.dataset.value = selectedValue;
    if (valueInput) valueInput.value = selectedValue;
  };
  const open = () => {
    if (input.disabled || openState || visibleRecords().length === 0) return;
    openState = true;
    listbox.hidden = false;
    root.dataset.state = "open";
    input.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    openState = false;
    listbox.hidden = true;
    root.dataset.state = "closed";
    input.setAttribute("aria-expanded", "false");
    setActive(null);
  };
  const filter = () => {
    const query = input.value.trim().toLocaleLowerCase();
    for (const record of records) {
      record.element.hidden = record.originalHidden || !record.label.toLocaleLowerCase().includes(query);
    }
    setActive(null);
    if (visibleRecords().length > 0) open();
    else close();
  };
  const selectRecord = (record: OptionRecord) => {
    if (isDisabled(record.element)) return;
    selectedValue = record.value;
    input.value = record.label;
    syncSelection();
    close();
    options.onValueChange?.(record.value, record.label);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const select = (value: string) => {
    const record = records.find((candidate) => candidate.value === value);
    if (record) selectRecord(record);
  };
  const move = (offset: number) => {
    const available = visibleRecords();
    if (available.length === 0) return;
    const currentIndex = active ? available.indexOf(active) : -1;
    const index = currentIndex < 0 ? (offset > 0 ? 0 : available.length - 1) : currentIndex + offset;
    setActive(available[((index % available.length) + available.length) % available.length] ?? null);
  };

  cleanup.add(addListener(input, "input", filter));
  cleanup.add(
    addListener(input, "focus", () => {
      if (options.openOnFocus ?? true) {
        filter();
        if (!active) setActive(visibleRecords()[0] ?? null);
      }
    }),
  );
  cleanup.add(
    addListener(input, "keydown", (event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "ArrowDown" || keyboardEvent.key === "ArrowUp") {
        keyboardEvent.preventDefault();
        open();
        move(keyboardEvent.key === "ArrowDown" ? 1 : -1);
      } else if (keyboardEvent.key === "Home" && openState) {
        keyboardEvent.preventDefault();
        setActive(visibleRecords()[0] ?? null);
      } else if (keyboardEvent.key === "End" && openState) {
        keyboardEvent.preventDefault();
        setActive(visibleRecords().at(-1) ?? null);
      } else if (keyboardEvent.key === "Enter" && active) {
        keyboardEvent.preventDefault();
        selectRecord(active);
      } else if (keyboardEvent.key === "Escape" && openState) {
        keyboardEvent.preventDefault();
        close();
      } else if (keyboardEvent.key === "Tab") {
        close();
      }
    }),
  );
  cleanup.add(
    addListener(listbox, "pointerdown", (event) => {
      const target = eventElement(event)?.closest<HTMLElement>("[role='option'], [data-cf-combobox-option]");
      if (!target || isDisabled(target)) return;
      event.preventDefault();
      const record = records.find((candidate) => candidate.element === target);
      if (record) {
        selectRecord(record);
        input.focus();
      }
    }),
  );
  cleanup.add(
    addListener(document, "pointerdown", (event) => {
      const target = eventElement(event);
      if (target && !root.contains(target)) close();
    }),
  );

  const initialRecord = records.find((record) => record.value === selectedValue);
  if (initialRecord && !input.value) input.value = initialRecord.label;
  syncSelection();
  close();

  return {
    open,
    close,
    select,
    getValue: () => selectedValue,
    isOpen: () => openState,
    destroy() {
      cleanup.destroy();
      for (const [attribute, value] of originalInputAttributes) {
        if (value === null) input.removeAttribute(attribute);
        else input.setAttribute(attribute, value);
      }
      if (generatedListboxId) listbox.removeAttribute("id");
      listbox.hidden = originalListboxHidden;
      for (const record of records) {
        record.element.hidden = record.originalHidden;
        record.element.removeAttribute("data-active");
        if (record.originalId === null) record.element.removeAttribute("id");
        else record.element.id = record.originalId;
        if (record.originalSelected === null) record.element.removeAttribute("aria-selected");
        else record.element.setAttribute("aria-selected", record.originalSelected);
      }
      if (originalRootState === null) root.removeAttribute("data-state");
      else root.setAttribute("data-state", originalRootState);
      if (originalRootValue === null) root.removeAttribute("data-value");
      else root.setAttribute("data-value", originalRootValue);
    },
  };
}
