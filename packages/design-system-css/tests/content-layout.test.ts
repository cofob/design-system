// @vitest-environment node

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const componentStyles = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");

describe("application and publishing CSS contracts", () => {
  it("keeps the application shell and content media primitives in the semantic stylesheet", () => {
    for (const selector of [
      ".cf-app-shell",
      ".cf-app-shell > main",
      ".cf-avatar",
      '.cf-avatar[data-size="sm"]',
      '.cf-avatar[data-size="lg"]',
      ".cf-inline-emoji",
      ".cf-media-grid",
      ".cf-media-grid > :where(li, figure)",
      ".cf-media-grid :where(img, video)",
      ".cf-media-grid :where(audio)",
      ".cf-search-result-card__tags",
    ]) {
      expect(componentStyles).toContain(selector);
    }
  });

  it("uses viewport growth, intrinsic inline emoji sizing, and bounded media", () => {
    expect(componentStyles).toMatch(/\.cf-app-shell\s*\{[^}]*min-block-size:\s*100vh/s);
    expect(componentStyles).toMatch(/\.cf-app-shell > main\s*\{[^}]*flex:\s*1 0 auto/s);
    expect(componentStyles).toMatch(/\.cf-inline-emoji\s*\{[^}]*inline-size:\s*1\.25em/s);
    expect(componentStyles).toMatch(/\.cf-media-grid :where\(img, video\)\s*\{[^}]*max-block-size:/s);
  });
});
