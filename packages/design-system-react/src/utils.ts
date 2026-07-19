export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function externalLinkProps(external: boolean | undefined): {
  target?: "_blank";
  rel?: "noreferrer noopener";
} {
  return external ? { target: "_blank", rel: "noreferrer noopener" } : {};
}

export function slugId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
