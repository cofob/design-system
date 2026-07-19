import { addListener, createCleanup, focusElement, queryAll } from "./internal/dom.js";
import type { Controller } from "./types.js";

export interface AccordionControllerOptions {
  multiple?: boolean;
  onValueChange?: (values: readonly string[]) => void;
}

export interface AccordionController extends Controller {
  getValues(): string[];
  setValues(values: readonly string[]): void;
}

export function createAccordionController(
  root: HTMLElement,
  options: AccordionControllerOptions = {},
): AccordionController {
  const cleanup = createCleanup();
  const details = queryAll<HTMLDetailsElement>(root, "details");
  const summaries = details
    .map((detail) => detail.querySelector<HTMLElement>(":scope > summary"))
    .filter((summary): summary is HTMLElement => summary !== null);
  const multiple = options.multiple ?? root.dataset.multiple === "true";

  const valueOf = (detail: HTMLDetailsElement, index: number) =>
    detail.dataset.value ?? detail.id ?? String(index);
  const getValues = () => details.flatMap((detail, index) => (detail.open ? [valueOf(detail, index)] : []));
  const emit = () => options.onValueChange?.(getValues());
  const sync = () => {
    details.forEach((detail) => {
      detail.dataset.state = detail.open ? "open" : "closed";
      detail.querySelector(":scope > summary")?.setAttribute("aria-expanded", String(detail.open));
    });
  };

  details.forEach((detail) => {
    cleanup.add(
      addListener(detail, "toggle", () => {
        if (detail.open && !multiple) {
          for (const other of details) if (other !== detail) other.open = false;
        }
        sync();
        emit();
      }),
    );
  });

  summaries.forEach((summary, index) => {
    cleanup.add(
      addListener(summary, "keydown", (event) => {
        const keyboardEvent = event as KeyboardEvent;
        let targetIndex: number | undefined;
        if (keyboardEvent.key === "ArrowDown") targetIndex = (index + 1) % summaries.length;
        if (keyboardEvent.key === "ArrowUp") targetIndex = (index - 1 + summaries.length) % summaries.length;
        if (keyboardEvent.key === "Home") targetIndex = 0;
        if (keyboardEvent.key === "End") targetIndex = summaries.length - 1;
        if (targetIndex !== undefined) {
          keyboardEvent.preventDefault();
          focusElement(summaries[targetIndex]);
        }
      }),
    );
  });

  sync();
  return {
    getValues,
    setValues(values) {
      const selected = new Set(multiple ? values : values.slice(0, 1));
      details.forEach((detail, index) => {
        detail.open = selected.has(valueOf(detail, index));
      });
      sync();
      emit();
    },
    destroy: cleanup.destroy,
  };
}
