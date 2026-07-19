export function cx(...values: unknown[]): string {
  const classes: string[] = [];
  const append = (value: unknown): void => {
    if (typeof value === "string" || typeof value === "number") {
      if (value) classes.push(String(value));
    } else if (Array.isArray(value)) {
      value.forEach(append);
    } else if (value && typeof value === "object") {
      for (const [name, enabled] of Object.entries(value)) if (enabled) classes.push(name);
    }
  };
  values.forEach(append);
  return classes.join(" ");
}

export function formatDate(value?: string | Date): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function runComposedEventHandlers<EventType extends Event>(
  event: EventType,
  consumer: ((event: EventType) => unknown) | null | undefined,
  internal: (event: EventType) => void,
  respectDefaultPrevented = false,
): void {
  consumer?.(event);
  if (!respectDefaultPrevented || !event.defaultPrevented) internal(event);
}
