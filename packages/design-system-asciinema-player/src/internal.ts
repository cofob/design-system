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
